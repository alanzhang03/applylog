import { createClient } from '@/lib/supabase-server';
import StatusSelect from './components/StatusSelect';
import LogoutButton from './components/LogoutButton';
import styles from './page.module.scss';

type Job = {
  id: string;
  url: string;
  title: string;
  company: string;
  provider: string;
  status: string;
  scraped_at: string;
};

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, url, title, company, provider, status, scraped_at')
    .eq('user_id', user?.id)
    .order('scraped_at', { ascending: false });

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>Failed to load: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Job Tracker</h1>
            <p className={styles.subtitle}>{jobs?.length ?? 0} jobs saved</p>
          </div>
          <LogoutButton />
        </div>

        {!jobs?.length ? (
          <div className={styles.empty}>
            No jobs yet — browse a job posting to get started.
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.th}>Company</th>
                  <th className={styles.th}>Role</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Source</th>
                  <th className={styles.th}>Date</th>
                  <th className={styles.th} />
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {jobs.map((job: Job) => (
                  <tr key={job.id}>
                    <td className={styles.tdCompany}>{job.company}</td>
                    <td className={styles.tdRole}>{job.title}</td>
                    <td className={styles.td}>
                      <StatusSelect id={job.id} status={job.status} />
                    </td>
                    <td className={styles.td}>
                      <span className={`${styles.badge} ${styles[job.provider] ?? styles.default}`}>
                        {job.provider}
                      </span>
                    </td>
                    <td className={styles.tdDate}>
                      {new Date(job.scraped_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                    <td className={styles.tdLink}>
                      <a href={job.url} target="_blank" rel="noopener noreferrer">View →</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
