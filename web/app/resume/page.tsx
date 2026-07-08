import { createClient } from '@/lib/supabase-server';
import AppHeader from '../components/AppHeader';
import ResumeForm from './ResumeForm';
import styles from './page.module.scss';

export default async function ResumePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: resumes } = await supabase
    .from('resumes')
    .select('id, content, created_at, file_path')
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

  return (
    <div className={styles.page}>
      <AppHeader />
      <div className={styles.container}>
        <h1 className={styles.title}>Resume</h1>

        <div className={styles.card}>
          {resumes?.[0] && signedUrls.has(resumes[0].id) && (
            <iframe
              src={`${signedUrls.get(resumes[0].id)}#view=FitH`}
              className={styles.savedPreview}
              title='Saved resume PDF'
            />
          )}
          <ResumeForm initialContent={resumes?.[0]?.content ?? ''} />
        </div>

        {olderResumes.length > 0 && (
          <>
            <h2 className={styles.historyTitle}>Past Versions</h2>
            {olderResumes.map((resume) => (
              <details key={resume.id} className={styles.historyItem}>
                <summary>
                  {new Date(resume.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </summary>
                <p>{resume.content}</p>
              </details>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
