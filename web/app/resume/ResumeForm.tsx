'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ResumeForm.module.scss';

export default function ResumeForm({ initialContent }: { initialContent: string }) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        setError('Failed to save resume.');
        return;
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));

    setExtracting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/extract-resume', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        setError('Failed to extract text from PDF.');
        return;
      }
      const { text } = await res.json();
      setContent(text);
    } finally {
      setExtracting(false);
      e.target.value = '';
    }
  }

  return (
    <div>
      <div className={styles.uploadRow}>
        Upload a PDF to auto-fill the text below (review it before saving):
        <input type="file" accept="application/pdf" onChange={handleFileChange} disabled={extracting} />
      </div>
      {extracting && <p className={styles.extracting}>Extracting text…</p>}

      <div className={styles.grid}>
        {previewUrl && (
          <div className={styles.previewWrap}>
            <iframe src={previewUrl} className={styles.preview} title="Uploaded resume PDF" />
          </div>
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={`${styles.textarea} ${!previewUrl ? styles.textareaFull : ''}`}
        />
      </div>

      <button onClick={handleSave} disabled={saving} className={styles.button}>
        {saving ? 'Saving…' : 'Save'}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
