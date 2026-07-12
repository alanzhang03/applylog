import type { SupabaseClient } from '@supabase/supabase-js';

export function extractCompany(subject: string): string | null {
  const patterns = [
    /applying to ([^!,\.]+)/i,
    /application to ([^!,\.]+)/i,
    /applying at ([^!,\.]+)/i,
    /applied at ([^!,\.]+)/i,
    /sent to ([^!,\.]+)/i,
    /viewed by ([^!,\.]+)/i,
    /^([^–\-]+)\s*[–\-]/,
  ];
  for (const pattern of patterns) {
    const match = subject.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

export async function syncGmailForUser(
  supabase: SupabaseClient,
  userId: string,
  refreshToken: string,
) {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const { access_token } = await tokenRes.json();
  if (!access_token) return;

  const after_date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '/');
  const query = `after:${after_date} subject:("your application" OR "application received" OR "thank you for applying" OR "we received your application")`;

  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=25`,
    { headers: { Authorization: `Bearer ${access_token}` } },
  );
  const listData = await listRes.json();
  const messages = listData.messages ?? [];

  const subjects: string[] = [];
  for (const msg of messages) {
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject`,
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    const msgData = await msgRes.json();
    const subject = msgData.payload.headers.find(
      (h: { name: string; value: string }) => h.name === 'Subject',
    )?.value;
    if (subject) subjects.push(subject);
  }

  const companies = [
    ...new Set(subjects.map(extractCompany).filter(Boolean) as string[]),
  ];

  const { data: matchedJobs } = await supabase
    .from('jobs')
    .select('id, company')
    .eq('user_id', userId)
    .in('company', companies);

  if (matchedJobs && matchedJobs.length > 0) {
    const ids = matchedJobs.map((j) => j.id);
    await supabase.from('jobs').update({ status: 'applied' }).in('id', ids);
  }
}
