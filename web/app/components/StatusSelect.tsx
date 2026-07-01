'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const OPTIONS = ['saved', 'applied', 'screen', 'interview', 'offer', 'rejected'] as const;

const STYLES: Record<string, { bg: string; text: string }> = {
  saved:     { bg: '#f4f4f5', text: '#71717a' },
  applied:   { bg: '#dbeafe', text: '#1d4ed8' },
  screen:    { bg: '#fef9c3', text: '#a16207' },
  interview: { bg: '#f3e8ff', text: '#7e22ce' },
  offer:     { bg: '#dcfce7', text: '#15803d' },
  rejected:  { bg: '#fee2e2', text: '#b91c1c' },
};

export default function StatusSelect({ id, status: initial }: { id: string; status: string }) {
  const [status, setStatus] = useState(initial);
  const style = STYLES[status] ?? STYLES.saved;

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setStatus(next);
    await supabase.from('jobs').update({ status: next }).eq('id', id);
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      style={{ backgroundColor: style.bg, color: style.text }}
      className="text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-zinc-300"
    >
      {OPTIONS.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
