import type { ScrapedJob } from '@autotrack/shared';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

async function saveJob(job: ScrapedJob): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
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
    }),
  });
  if (res.ok) {
    console.log('[AutoTrack] saved job', job.title, job.company);
  } else {
    const err = await res.text();
    console.error('[AutoTrack] failed to save job', res.status, err);
  }
}

chrome.runtime.onMessage.addListener((message: ScrapedJob) => {
  saveJob(message);
});
