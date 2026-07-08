'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ResumeForm.module.scss';

export default function ResumeForm({
  initialContent,
  savedPdfUrl,
}: {
  initialContent: string;
  savedPdfUrl: string | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState(initialContent);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const pdfUrl = previewUrl ?? savedPdfUrl;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('content', content);
      if (file) formData.append('file', file);

      const res = await fetch('/api/resume', {
        method: 'POST',
        body: formData,
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
    setFile(file);

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
        <button
          type='button'
          className={styles.uploadButton}
          onClick={() => fileInputRef.current?.click()}
          disabled={extracting}
        >
          {extracting ? 'Extracting…' : 'Choose PDF'}
        </button>
        <span className={styles.uploadHint}>
          {file
            ? file.name
            : 'Upload a PDF of your Resume to auto-fill the text below (review it before saving)'}
        </span>
        <input
          ref={fileInputRef}
          type='file'
          accept='application/pdf'
          onChange={handleFileChange}
          disabled={extracting}
          className={styles.hiddenInput}
        />
      </div>

      {pdfUrl && (
        <iframe
          src={`${pdfUrl}#view=FitH`}
          className={styles.preview}
          title='Resume PDF'
        />
      )}

      <label className={styles.textareaLabel}>Parsed text</label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className={styles.textarea}
      />

      <button onClick={handleSave} disabled={saving} className={styles.button}>
        {saving ? 'Saving…' : 'Save'}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
