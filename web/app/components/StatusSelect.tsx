'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './StatusSelect.module.scss';

const OPTIONS = ['saved', 'applied', 'screen', 'interview', 'offer', 'rejected'] as const;

const COLORS: Record<string, { bg: string; color: string }> = {
  saved:     { bg: '#f4f4f5', color: '#71717a' },
  applied:   { bg: '#dbeafe', color: '#1d4ed8' },
  screen:    { bg: '#fef9c3', color: '#a16207' },
  interview: { bg: '#f3e8ff', color: '#7e22ce' },
  offer:     { bg: '#dcfce7', color: '#15803d' },
  rejected:  { bg: '#fee2e2', color: '#b91c1c' },
};

export default function StatusSelect({ id, status: initial }: { id: string; status: string }) {
  const [status, setStatus] = useState(initial);
  const color = COLORS[status] ?? COLORS.saved;

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setStatus(next);
    await supabase.from('jobs').update({ status: next }).eq('id', id);
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      className={styles.select}
      style={{ backgroundColor: color.bg, color: color.color }}
    >
      {OPTIONS.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
