const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const EXT_REDIRECT = `https://${chrome.runtime.id}.chromiumapp.org/`;

function parseJwt(token: string): Record<string, string> {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  const array = crypto.getRandomValues(new Uint8Array(32));
  const verifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  return { verifier, challenge };
}

async function getSession(): Promise<{ access_token: string; email: string } | null> {
  const result = await chrome.storage.local.get(['access_token', 'email']);
  if (result.access_token && result.email) {
    return { access_token: result.access_token, email: result.email };
  }
  return null;
}

async function signIn() {
  const { verifier, challenge } = await generatePKCE();

  const authUrl =
    `${SUPABASE_URL}/auth/v1/authorize?provider=google` +
    `&redirect_to=${encodeURIComponent(EXT_REDIRECT)}` +
    `&code_challenge=${challenge}&code_challenge_method=S256`;

  const redirectUrl = await chrome.identity.launchWebAuthFlow({
    url: authUrl,
    interactive: true,
  });

  if (!redirectUrl) return;

  const code = new URL(redirectUrl).searchParams.get('code');
  if (!code) return;

  const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
  });

  const { access_token, refresh_token } = await tokenRes.json();
  if (!access_token) return;

  const payload = parseJwt(access_token);
  const email = payload.email ?? '';
  const user_id = payload.sub ?? '';

  await chrome.storage.local.set({ access_token, refresh_token, email, user_id });
  showSignedIn(email);
}

async function signOut() {
  await chrome.storage.local.remove(['access_token', 'refresh_token', 'email', 'user_id']);
  showSignedOut();
}

function showSignedIn(email: string) {
  (document.getElementById('signedOut') as HTMLElement).style.display = 'none';
  (document.getElementById('signedIn') as HTMLElement).style.display = 'block';
  (document.getElementById('subtitle') as HTMLElement).textContent = 'Tracking your applications';
  (document.getElementById('email') as HTMLElement).textContent = email;
}

function showSignedOut() {
  (document.getElementById('signedOut') as HTMLElement).style.display = 'block';
  (document.getElementById('signedIn') as HTMLElement).style.display = 'none';
  (document.getElementById('subtitle') as HTMLElement).textContent = 'Sign in to start tracking jobs';
}

document.getElementById('signinBtn')!.addEventListener('click', signIn);
document.getElementById('signoutBtn')!.addEventListener('click', signOut);

getSession().then((session) => {
  if (session) showSignedIn(session.email);
});
