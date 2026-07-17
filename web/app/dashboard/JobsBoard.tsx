'use client';

import { useState } from 'react';
import Link from 'next/link';
import StatusSelect from '@/app/components/StatusSelect';
import DeleteJobButton from '@/app/components/DeleteJobButton';
import { STATUSES, matchTier, stripHtml, type Job } from './JobsTable';
import pageStyles from './page.module.scss';
import styles from './JobsBoard.module.scss';

export default function JobsBoard({
  jobs,
  onStatusChange,
}: {
  jobs: Job[];
  onStatusChange: (jobId: string, status: string) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  return (
    <div className={styles.board}>
      {STATUSES.map((status) => {
        const columnJobs = jobs.filter((job) => job.status === status);
        return (
          <div
            key={status}
            className={`${styles.column} ${dragOverStatus === status ? styles.columnDragOver : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStatus(status);
            }}
            onDragLeave={() =>
              setDragOverStatus((current) =>
                current === status ? null : current,
              )
            }
            onDrop={(e) => {
              e.preventDefault();
              const jobId = e.dataTransfer.getData('text/plain');
              if (jobId) onStatusChange(jobId, status);
              setDragOverStatus(null);
            }}
          >
            <div className={`${styles.columnHeader} ${styles[status]}`}>
              <span className={styles.columnTitle}>{status}</span>
              <span className={styles.columnCount}>{columnJobs.length}</span>
            </div>
            <div className={styles.cards}>
              {columnJobs.map((job) => (
                <div
                  key={job.id}
                  className={`${styles.card} ${draggingId === job.id ? styles.cardDragging : ''}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', job.id);
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggingId(job.id);
                  }}
                  onDragEnd={() => setDraggingId(null)}
                >
                  <Link href={`/jobs/${job.id}`} className={styles.cardLink}>
                    <div className={styles.cardCompany}>{job.company}</div>
                    <div
                      className={
                        job.title
                          ? styles.cardTitle
                          : `${styles.cardTitle} ${pageStyles.untitled}`
                      }
                    >
                      {job.title || 'Untitled role'}
                    </div>
                    {job.description && (
                      <div
                        className={pageStyles.description}
                        title={stripHtml(job.description)}
                      >
                        {stripHtml(job.description)}
                      </div>
                    )}
                  </Link>
                  <div className={styles.cardMeta}>
                    <span
                      className={`${pageStyles.badge} ${pageStyles[job.provider] ?? pageStyles.default}`}
                    >
                      {job.provider}
                    </span>
                    {job.match_score !== null && (
                      <span
                        className={`${pageStyles.matchBadge} ${pageStyles[matchTier(job.match_score)]}`}
                      >
                        {Math.round(job.match_score * 100)}%
                      </span>
                    )}
                  </div>
                  <div className={styles.cardFooter}>
                    <StatusSelect id={job.id} status={job.status} />
                    <div className={styles.cardActions}>
                      <a href={job.url} target='_blank' rel='noopener noreferrer'>
                        View →
                      </a>
                      <DeleteJobButton id={job.id} className={pageStyles.deleteButton}>
                        Delete
                      </DeleteJobButton>
                    </div>
                  </div>
                </div>
              ))}
              {!columnJobs.length && (
                <div className={styles.emptyColumn}>No jobs</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
