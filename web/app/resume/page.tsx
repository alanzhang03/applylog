import { createClient } from '@/lib/supabase-server';
import AppHeader from '../components/AppHeader';
import ResumeForm from './ResumeForm';
import styles from './page.module.scss';
import ResumeVersions from './ResumeVersions';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function ResumePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: resumes } = await supabase
    .from('resumes')
    .select('id, content, created_at, file_path, version')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  const signedUrls = new Map<string, string>();
  for (const resume of resumes ?? []) {
    if (!resume.file_path) continue;
    const { data } = await supabase.storage
      .from('resumes')
      .createSignedUrl(resume.file_path, 60 * 60);
    if (data) signedUrls.set(resume.id, data.signedUrl);
  }

  const olderResumes = resumes?.slice(1) ?? [];
  const olderVersions = olderResumes.map((resume) => ({
    id: resume.id,
    version: resume.version,
    date: formatDate(resume.created_at),
    url: signedUrls.get(resume.id) ?? null,
  }));

  return (
    <div className={styles.page}>
      <AppHeader />
      <div className={styles.container}>
        <h1 className={styles.title}>Resume</h1>

        <div className={styles.card}>
          <ResumeForm
            initialContent={resumes?.[0]?.content ?? ''}
            savedPdfUrl={
              resumes?.[0] ? (signedUrls.get(resumes[0].id) ?? null) : null
            }
          />
        </div>

        {olderVersions.length > 0 && (
          <>
            {' '}
            <h2 className={styles.historyTitle}>Past Versions</h2>
            <ResumeVersions versions={olderVersions} />
          </>
        )}
      </div>
    </div>
  );
}
