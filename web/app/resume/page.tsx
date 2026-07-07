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
    .select('id, content, created_at')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  const olderResumes = resumes?.slice(1) ?? [];

  return (
    <div className={styles.page}>
      <AppHeader />
      <div className={styles.container}>
        <h1 className={styles.title}>Resume</h1>

        <div className={styles.card}>
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
