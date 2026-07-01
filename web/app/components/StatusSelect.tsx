'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const OPTIONS = ['saved', 'applied', 'screen', 'interview', 'offer', 'rejected'] as const;

const COLORS: Record<string, string> = {
  saved: 'text-zinc-400',
  applied: 'text-blue-600',
  screen: 'text-yellow-600',
  interview: 'text-purple-600',
  offer: 'text-green-600',
  rejected: 'text-red-500',
};

export default function StatusSelect({ id, status: initial }: { id: string; status: string }) {
  const [status, setStatus] = useState(initial);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setStatus(next);
    await supabase.from('jobs').update({ status: next }).eq('id', id);
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      className={`bg-transparent text-sm font-medium cursor-pointer focus:outline-none ${COLORS[status]}`}
    >
      {OPTIONS.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
