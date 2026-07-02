'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './LogoutButton.module.scss';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <button onClick={handleLogout} className={styles.button}>
      Sign out
    </button>
  );
}
