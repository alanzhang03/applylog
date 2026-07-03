import Link from 'next/link';
import styles from './page.module.scss';

const steps = [
  {
    title: 'Install the extension',
    description:
      'Add AutoTrack to Chrome and sign in with Google — no setup, no configuration.',
  },
  {
    title: 'Browse job postings',
    description:
      'Visit any listing on Greenhouse, Lever, Ashby, or Workday and it’s saved automatically in the background.',
  },
  {
    title: 'Stay in sync',
    description:
      'AutoTrack scans Gmail for confirmation emails and moves matching jobs to "applied" for you.',
  },
];

const features = [
  {
    title: 'Auto-scraping',
    description:
      'Capture job title, company, and description automatically as you browse postings on Greenhouse, Lever, Ashby, and Workday.',
  },
  {
    title: 'Gmail sync',
    description:
      'Detects application confirmation emails and marks matching jobs as applied — no manual updates needed.',
  },
  {
    title: 'Status tracking',
    description:
      'Move jobs through saved → applied → screen → interview → offer as your pipeline progresses.',
  },
];

const previewJobs = [
  { company: 'Stripe', title: 'Product Engineer', status: 'applied', provider: 'greenhouse' },
  { company: 'Figma', title: 'Frontend Engineer', status: 'interview', provider: 'lever' },
  { company: 'Notion', title: 'Software Engineer', status: 'screen', provider: 'ashby' },
  { company: 'Airbnb', title: 'Backend Engineer', status: 'saved', provider: 'workday' },
];

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <span className={styles.wordmark}>AutoTrack</span>
          <Link href="/login" className={styles.navLink}>Sign in</Link>
        </div>
      </nav>

      <section className={styles.hero}>
        <span className={styles.eyebrow}>Chrome extension + web dashboard</span>
        <h1 className={styles.heroTitle}>
          Automatically track your job applications across the web.
        </h1>
        <p className={styles.heroSubtitle}>
          AutoTrack saves job postings as you browse, detects when you&apos;ve
          applied via Gmail, and keeps everything organized in one place.
        </p>
        <Link href="/login" className={styles.cta}>
          Get started
        </Link>
      </section>

      <section className={styles.previewSection}>
        <div className={styles.previewFrame}>
          <div className={styles.previewBar}>
            <span className={styles.dot} data-color="red" />
            <span className={styles.dot} data-color="yellow" />
            <span className={styles.dot} data-color="green" />
          </div>
          <div className={styles.previewBody}>
            <div className={styles.previewHeader}>
              <span>Job Tracker</span>
              <span className={styles.previewCount}>{previewJobs.length} jobs saved</span>
            </div>
            <table className={styles.previewTable}>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {previewJobs.map((job) => (
                  <tr key={job.company}>
                    <td className={styles.previewCompany}>{job.company}</td>
                    <td>{job.title}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[job.status]}`}>
                        {job.status}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.providerBadge} ${styles[job.provider]}`}>
                        {job.provider}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>How it works</h2>
        <div className={styles.steps}>
          {steps.map((step, i) => (
            <div key={step.title} className={styles.step}>
              <span className={styles.stepNumber}>{i + 1}</span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDescription}>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Features</h2>
        <div className={styles.features}>
          {features.map((feature) => (
            <div key={feature.title} className={styles.featureCard}>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <span className={styles.footerWordmark}>AutoTrack</span>
        <Link href="/login" className={styles.navLink}>Sign in</Link>
      </footer>
    </div>
  );
}
