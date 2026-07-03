import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import StatusSelect from '@/app/components/StatusSelect';
import styles from './page.module.scss';

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from('jobs')
    .select('id, url, title, company, provider, status, scraped_at, description')
    .eq('id', id)
    .single();

  if (!job) notFound();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.back}>← Back</Link>

        <div className={styles.card}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>{job.title}</h1>
              <p className={styles.company}>{job.company}</p>
            </div>
            <div className={styles.meta}>
              <span className={`${styles.badge} ${styles[job.provider] ?? styles.default}`}>
                {job.provider}
              </span>
              <StatusSelect id={job.id} status={job.status} />
            </div>
          </div>

          <div className={styles.info}>
            <span className={styles.date}>
              Saved {new Date(job.scraped_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <a href={job.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
              View posting →
            </a>
          </div>

          {job.description && (
            <div className={styles.description}>
              <h2 className={styles.descTitle}>Job Description</h2>
              <div className={styles.descBody}>
                {job.description.split('\n').map((line: string, i: number) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
