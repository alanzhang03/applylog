'use client';
import { useState } from 'react';
import styles from './GmailSync.module.scss';

export default function GmailSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sync() {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch('/api/gmail-sync/manual', { method: 'POST' });
      if (!res.ok) {
        setError(`Sync failed (${res.status})`);
        return;
      }
      setLastSyncedAt(new Date());
    } catch {
      setError('Sync failed — try again in a moment.');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className={styles.syncBar}>
      <button onClick={sync} disabled={syncing} className={styles.button}>
        {syncing ? 'Syncing…' : 'Sync now'}
      </button>
      {error ? (
        <span className={styles.error}>{error}</span>
      ) : (
        lastSyncedAt && (
          <span className={styles.status}>
            Synced{' '}
            {lastSyncedAt.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </span>
        )
      )}
    </div>
  );
}
