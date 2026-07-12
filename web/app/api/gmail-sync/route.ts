import { createClient } from '@supabase/supabase-js';
import { extractCompany } from '@/lib/gmail';

export async function POST(request: Request) {
  const secret = request.headers.get('x-webhook-secret');
  if (secret !== process.env.GMAIL_SYNC_SECRET) {
    return new Response(null, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: tokens } = await supabase
    .from('gmail_tokens')
    .select('user_id, refresh_token');

  for (const { user_id, refresh_token } of tokens ?? []) {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    const { access_token } = await tokenRes.json();

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
      .eq('user_id', user_id)
      .in('company', companies);
    if (matchedJobs && matchedJobs.length > 0) {
      const ids = matchedJobs.map((j) => j.id);
      await supabase.from('jobs').update({ status: 'applied' }).in('id', ids);
    }
  }

  return new Response(null, { status: 200 });
}
