'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function extractCompany(subject: string): string | null {
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

export default function GmailSync() {
  const router = useRouter();
  useEffect(() => {
    async function sync() {
      const last_synced_at = localStorage.getItem('last_synced_at');
      const after_date =
        last_synced_at ??
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, '/');

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.provider_token;
      if (!token) {
        return;
      }
      const query = `after:${after_date} subject:("your application" OR "application received" OR "thank you for applying" OR "we received your application")`;
      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=25`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const listData = await listRes.json();
      const messages = listData.messages ?? [];
      let messages_wanted: { id: string; subject: string }[] = [];

      for (const msg of messages) {
        const res = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const msgData = await res.json();
        const subject = msgData.payload.headers.find(
          (h: { name: string; value: string }) => h.name === 'Subject',
        )?.value;
        if (subject) messages_wanted.push({ id: msg.id, subject });
      }
      const companies = [
        ...new Set(
          messages_wanted
            .map((m) => extractCompany(m.subject))
            .filter(Boolean) as string[],
        ),
      ];
      const { data: matchedJobs, error } = await supabase
        .from('jobs')
        .select('id, company')
        .eq('user_id', session?.user.id)
        .in('company', companies);
      if (matchedJobs && matchedJobs.length > 0) {
        const ids = matchedJobs.map((j) => j.id);
        await supabase.from('jobs').update({ status: 'applied' }).in('id', ids);
        router.refresh();
      }
      localStorage.setItem(
        'last_synced_at',
        new Date().toISOString().slice(0, 10).replace(/-/g, '/'),
      );
    }

    sync();
  }, []);

  return null;
}
