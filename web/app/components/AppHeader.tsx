import Link from 'next/link';
import LogoutButton from './LogoutButton';
import styles from './AppHeader.module.scss';

export default function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/dashboard" className={styles.wordmark}>AutoTrack</Link>
        <LogoutButton />
      </div>
    </header>
  );
}
