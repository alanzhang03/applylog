import { createClient } from '@/lib/supabase-server';
import AppHeader from '@/app/components/AppHeader';
import GmailSync from '@/app/components/GmailSync';
import JobsTable from './JobsTable';
import styles from './page.module.scss';

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(
      'id, url, title, company, provider, status, scraped_at, description, match_score',
    )
    .eq('user_id', user?.id)
    .order('scraped_at', { ascending: false });

  if (error) {
    return (
      <div className={styles.page}>
        <AppHeader />
        <div className={styles.container}>
          <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>
            Failed to load: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <AppHeader />
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Job Tracker</h1>
            <p className={styles.subtitle}>{jobs?.length ?? 0} jobs saved</p>
          </div>
          <GmailSync />
        </div>

        <JobsTable jobs={jobs ?? []} />
      </div>
    </div>
  );
}
