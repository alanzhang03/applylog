'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import StatusSelect from '@/app/components/StatusSelect';
import styles from './page.module.scss';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export type Job = {
  id: string;
  url: string;
  title: string;
  company: string;
  provider: string;
  status: string;
  scraped_at: string;
  description: string;
};

const STATUSES = ['saved', 'applied', 'screen', 'interview', 'offer', 'rejected'] as const;

export default function JobsTable({ jobs }: { jobs: Job[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  const providers = useMemo(
    () => [...new Set(jobs.map((job) => job.provider))].sort(),
    [jobs],
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const status of STATUSES) map[status] = 0;
    for (const job of jobs) map[job.status] = (map[job.status] ?? 0) + 1;
    return map;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobs.filter((job) => {
      if (statusFilter !== 'all' && job.status !== statusFilter) return false;
      if (sourceFilter !== 'all' && job.provider !== sourceFilter) return false;
      if (
        query &&
        !job.company.toLowerCase().includes(query) &&
        !job.title.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [jobs, search, statusFilter, sourceFilter]);

  if (!jobs.length) {
    return (
      <div className={styles.onboarding}>
        <h2 className={styles.onboardingTitle}>No jobs yet</h2>
        <p className={styles.onboardingSubtitle}>
          Jobs show up here automatically once the extension is tracking your browsing.
        </p>
        <ol className={styles.onboardingSteps}>
          <li>
            <span className={styles.onboardingNumber}>1</span>
            Install the AutoTrack Chrome extension and load it as an unpacked extension.
          </li>
          <li>
            <span className={styles.onboardingNumber}>2</span>
            Sign in to the extension with the same Google account you used here.
          </li>
          <li>
            <span className={styles.onboardingNumber}>3</span>
            Browse a job posting on Greenhouse, Lever, Ashby, or Workday — it&apos;ll be saved here automatically.
          </li>
        </ol>
      </div>
    );
  }

  return (
    <>
      <div className={styles.statsBar}>
        {STATUSES.map((status) => (
          <button
            key={status}
            className={`${styles.statChip} ${styles[status]} ${statusFilter === status ? styles.statChipActive : ''}`}
            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
          >
            <span className={styles.statValue}>{counts[status]}</span>
            <span className={styles.statLabel}>{status}</span>
          </button>
        ))}
      </div>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search company or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className={styles.selectFilter}
        >
          <option value="all">All sources</option>
          {providers.map((provider) => (
            <option key={provider} value={provider}>{provider}</option>
          ))}
        </select>
      </div>

      {!filteredJobs.length ? (
        <div className={styles.empty}>No jobs match your filters.</div>
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
              {filteredJobs.map((job) => (
                <tr key={job.id}>
                  <td className={styles.tdCompany}>
                    <Link href={`/jobs/${job.id}`} className={styles.rowLink}>{job.company}</Link>
                  </td>
                  <td className={styles.tdRole}>
                    <Link href={`/jobs/${job.id}`} className={styles.rowLink}>
                      <div className={job.title ? undefined : styles.untitled}>
                        {job.title || 'Untitled role'}
                      </div>
                      {job.description && (
                        <div className={styles.description} title={stripHtml(job.description)}>
                          {stripHtml(job.description)}
                        </div>
                      )}
                    </Link>
                  </td>
                  <td className={styles.td}>
                    <StatusSelect id={job.id} status={job.status} />
                  </td>
                  <td className={styles.td}>
                    <span
                      className={`${styles.badge} ${styles[job.provider] ?? styles.default}`}
                    >
                      {job.provider}
                    </span>
                  </td>
                  <td className={styles.tdDate}>
                    {new Date(job.scraped_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className={styles.tdLink}>
                    <a href={job.url} target="_blank" rel="noopener noreferrer">
                      View →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
