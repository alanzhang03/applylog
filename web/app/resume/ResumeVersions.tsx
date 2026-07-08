'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ResumeVersions.module.scss';

type Version = {
  id: string;
  version: number;
  date: string;
  url: string | null;
};

export default function ResumeVersions({ versions }: { versions: Version[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const match = window.location.hash.match(/^#v(\d+)$/);
    if (!match) return;
    const target = versions.find((v) => String(v.version) === match[1]);
    if (!target) return;
    requestAnimationFrame(() => {
      setOpenId(target.id);
      rowRefs.current[target.id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }, [versions]);

  return (
    <>
      {versions.map((v) => (
        <div
          key={v.id}
          id={`v${v.version}`}
          ref={(el) => {
            rowRefs.current[v.id] = el;
          }}
          className={styles.item}
        >
          <button
            className={styles.summary}
            onClick={() => setOpenId(openId === v.id ? null : v.id)}
          >
            <span className={styles.version}>Resume v{v.version}</span>
            <span className={styles.date}>{v.date}</span>
          </button>

          {openId === v.id &&
            (v.url ? (
              <iframe
                src={`${v.url}#view=FitH`}
                className={styles.preview}
                title={`Resume v${v.version}`}
              />
            ) : (
              <p className={styles.empty}>No PDF saved for this version.</p>
            ))}
        </div>
      ))}
    </>
  );
}
