async function getSession(): Promise<{
  access_token: string;
  email: string;
} | null> {
  const result = await chrome.storage.local.get(['access_token', 'email']);
  if (result.access_token && result.email) {
    return { access_token: result.access_token, email: result.email };
  }
  return null;
}

async function signIn() {
  console.log('[AutoTrack] popup: requesting sign-in from background');
  const res = await chrome.runtime.sendMessage({ type: 'AUTOTRACK_SIGN_IN' });
  console.log('[AutoTrack] popup: sign-in response', res);

  if (res?.ok) {
    showSignedIn(res.email);
  } else {
    console.error('[AutoTrack] popup: sign-in failed:', res?.error);
  }
}

async function signOut() {
  await chrome.runtime.sendMessage({ type: 'AUTOTRACK_SIGN_OUT' });
  showSignedOut();
}

function showSignedIn(email: string) {
  (document.getElementById('signedOut') as HTMLElement).style.display = 'none';
  (document.getElementById('signedIn') as HTMLElement).style.display = 'block';
  (document.getElementById('subtitle') as HTMLElement).textContent =
    'Tracking your applications';
  (document.getElementById('email') as HTMLElement).textContent = email;
}

function showSignedOut() {
  (document.getElementById('signedOut') as HTMLElement).style.display = 'block';
  (document.getElementById('signedIn') as HTMLElement).style.display = 'none';
  (document.getElementById('subtitle') as HTMLElement).textContent =
    'Sign in to start tracking jobs';
}

document.getElementById('signinBtn')!.addEventListener('click', signIn);
document.getElementById('signoutBtn')!.addEventListener('click', signOut);

getSession().then((session) => {
  if (session) showSignedIn(session.email);
});
