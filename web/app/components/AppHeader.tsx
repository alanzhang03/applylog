import Link from 'next/link';
import LogoutButton from './LogoutButton';
import styles from './AppHeader.module.scss';

export default function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <nav className={styles.nav}>
          <Link href='/dashboard' className={styles.wordmark}>
            ApplyLog
          </Link>
          <Link href='/resume' className={styles.navLink}>
            Resume
          </Link>
        </nav>
        <LogoutButton />
      </div>
    </header>
  );
}
