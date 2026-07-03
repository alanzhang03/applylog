'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DeleteJobButton({
  id,
  className,
  children = 'Delete',
  onDeleted,
  redirectTo,
}: {
  id: string;
  className?: string;
  children?: React.ReactNode;
  onDeleted?: () => void;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this job? This can\'t be undone.')) return;

    setPending(true);
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    setPending(false);

    if (error) {
      window.alert(`Failed to delete: ${error.message}`);
      return;
    }

    onDeleted?.();
    if (redirectTo) router.push(redirectTo);
  }

  return (
    <button type="button" onClick={handleDelete} className={className} disabled={pending}>
      {pending ? 'Deleting…' : children}
    </button>
  );
}
