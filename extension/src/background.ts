import type { ScrapedJob } from '@applylog/shared';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const EXT_REDIRECT = `https://${chrome.runtime.id}.chromiumapp.org/`;

function parseJwt(token: string): Record<string, string> {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

async function generatePKCE(): Promise<{
  verifier: string;
  challenge: string;
}> {
  const array = crypto.getRandomValues(new Uint8Array(32));
  const verifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier),
  );
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return { verifier, challenge };
}

async function signIn(): Promise<
  { ok: true; email: string } | { ok: false; error: string }
> {
  try {
    const { verifier, challenge } = await generatePKCE();

    const authUrl =
      `${SUPABASE_URL}/auth/v1/authorize?provider=google` +
      `&redirect_to=${encodeURIComponent(EXT_REDIRECT)}` +
      `&code_challenge=${challenge}&code_challenge_method=S256`;

    console.log('[ApplyLog] launching auth flow:', authUrl);
    const redirectUrl = await chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true,
    });
    console.log('[ApplyLog] auth flow redirected to:', redirectUrl);

    if (!redirectUrl) {
      return {
        ok: false,
        error: 'launchWebAuthFlow returned no redirect (cancelled or blocked)',
      };
    }

    const code = new URL(redirectUrl).searchParams.get('code');
    if (!code) {
      return {
        ok: false,
        error: `no "code" param in redirect url: ${redirectUrl}`,
      };
    }

    const tokenRes = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=pkce`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
      },
    );

    const tokenData = await tokenRes.json();
    console.log('[ApplyLog] token exchange status:', tokenRes.status);

    const { access_token, refresh_token } = tokenData;
    if (!access_token) {
      return {
        ok: false,
        error:
          tokenData.error_description ??
          tokenData.msg ??
          'no access_token in token response',
      };
    }

    const payload = parseJwt(access_token);
    const email = payload.email ?? '';
    const user_id = payload.sub ?? '';

    await chrome.storage.local.set({
      access_token,
      refresh_token,
      email,
      user_id,
    });
    console.log('[ApplyLog] signed in as', email);
    return { ok: true, email };
  } catch (err) {
    console.error('[ApplyLog] sign-in failed:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    console.log(
      '[ApplyLog] refreshAccessToken: refresh already in flight, reusing it',
    );
    return refreshPromise;
  }
  refreshPromise = doRefreshAccessToken().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function doRefreshAccessToken(): Promise<string | null> {
  const { refresh_token } = await chrome.storage.local.get(['refresh_token']);
  console.log(
    '[ApplyLog] refreshAccessToken: have refresh_token?',
    !!refresh_token,
  );

  if (!refresh_token) {
    console.error(
      '[ApplyLog] refreshAccessToken: no refresh_token in storage, cannot refresh',
    );
    return null;
  }

  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ refresh_token }),
    },
  );

  const data = await res.json();
  console.log('[ApplyLog] refreshAccessToken: response status', res.status);

  if (!res.ok || !data.access_token) {
    console.error(
      '[ApplyLog] refreshAccessToken: failed —',
      data.error_description ?? data.msg ?? data.error ?? 'unknown error',
    );
    return null;
  }

  await chrome.storage.local.set({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });
  console.log('[ApplyLog] refreshAccessToken: refreshed successfully');
  return data.access_token as string;
}

async function saveJob(job: ScrapedJob): Promise<void> {
  try {
    console.log('[ApplyLog] saveJob: starting for', job.url);
    const { access_token, user_id } = await chrome.storage.local.get([
      'access_token',
      'user_id',
    ]);
    console.log(
      '[ApplyLog] saveJob: have access_token?',
      !!access_token,
      'user_id?',
      !!user_id,
    );

    if (!access_token || !user_id) {
      console.warn('[ApplyLog] not signed in — job not saved');
      return;
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs?on_conflict=url`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates',
      },
      body: JSON.stringify({
        url: job.url,
        title: job.title,
        company: job.company,
        description: job.description,
        provider: job.provider,
        status: 'saved',
        user_id,
      }),
    });
    console.log('[ApplyLog] saveJob: insert response status', res.status);

    if (res.ok) {
      console.log('[ApplyLog] saved job', job.title, job.company);
    } else if (res.status === 401) {
      console.log('[ApplyLog] saveJob: got 401, refreshing token');
      const newToken = await refreshAccessToken();
      if (!newToken) {
        console.error(
          '[ApplyLog] saveJob: token refresh returned no token, giving up',
        );
        return;
      }
      const retry = await fetch(
        `${SUPABASE_URL}/rest/v1/jobs?on_conflict=url`,
        {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${newToken}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=ignore-duplicates',
          },
          body: JSON.stringify({
            url: job.url,
            title: job.title,
            company: job.company,
            description: job.description,
            provider: job.provider,
            status: 'saved',
            user_id,
          }),
        },
      );
      if (retry.ok) {
        console.log(
          '[ApplyLog] saved job after token refresh',
          job.title,
          job.company,
        );
      } else {
        const retryErr = await retry.text();
        console.error(
          '[ApplyLog] failed after token refresh',
          retry.status,
          retryErr,
        );
      }
    } else {
      const err = await res.text();
      console.error('[ApplyLog] failed to save job', res.status, err);
    }
  } catch (e) {
    console.error('[ApplyLog] saveJob: threw an exception', e);
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'APPLYLOG_SIGN_IN') {
    signIn().then(sendResponse);
    return true;
  }

  if (message?.type === 'APPLYLOG_SIGN_OUT') {
    chrome.storage.local
      .remove(['access_token', 'refresh_token', 'email', 'user_id'])
      .then(() => sendResponse({ ok: true }));
    return true;
  }

  console.log('[ApplyLog] background: received scraped job message', message);
  saveJob(message as ScrapedJob);
});
