import { createClient } from '@/lib/supabase-server';
import AppHeader from '@/app/components/AppHeader';
import styles from './page.module.scss';

const STATUSES = ['saved', 'applied', 'interview', 'offer', 'rejected'] as const;
type Status = (typeof STATUSES)[number];

const STATUS_COLOR: Record<Status, string> = {
  saved: '#71717a',
  applied: '#1d4ed8',
  interview: '#7e22ce',
  offer: '#15803d',
  rejected: '#b91c1c',
};

const PROVIDER_COLOR: Record<string, string> = {
  greenhouse: '#047857',
  lever: '#1d4ed8',
  ashby: '#6d28d9',
  workday: '#b45309',
};
const PROVIDER_DEFAULT_COLOR = '#52525b';

const MATCH_COLOR = {
  high: '#15803d',
  medium: '#a16207',
  low: '#52525b',
  unscored: '#a1a1aa',
};

type Row = {
  status: string;
  provider: string;
  scraped_at: string;
  match_score: number | null;
};

function matchBucket(score: number | null): keyof typeof MATCH_COLOR {
  if (score === null) return 'unscored';
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function Bar({
  label,
  count,
  total,
  max,
  color,
}: {
  label: string;
  count: number;
  total: number;
  max: number;
  color: string;
}) {
  const width = max === 0 ? 0 : Math.round((count / max) * 100);
  return (
    <div className={styles.barRow}>
      <span className={styles.barLabel}>{label}</span>
      <div className={styles.barTrack}>
        <div
          className={styles.barFill}
          style={{ width: `${width}%`, background: color }}
        />
      </div>
      <span className={styles.barValue}>
        {count}
        <span className={styles.barPercent}>{pct(count, total)}%</span>
      </span>
    </div>
  );
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('jobs')
    .select('status, provider, scraped_at, match_score')
    .eq('user_id', user?.id);

  const jobs = (data ?? []) as Row[];

  if (error) {
    return (
      <div className={styles.page}>
        <AppHeader />
        <div className={styles.container}>
          <p className={styles.errorText}>Failed to load: {error.message}</p>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className={styles.page}>
        <AppHeader />
        <div className={styles.container}>
          <h1 className={styles.title}>Analytics</h1>
          <div className={styles.empty}>
            Save a few jobs first — analytics will show up here once you have data.
          </div>
        </div>
      </div>
    );
  }

  const total = jobs.length;
  const statusCounts = Object.fromEntries(
    STATUSES.map((s) => [s, jobs.filter((j) => j.status === s).length]),
  ) as Record<Status, number>;
  const maxStatusCount = Math.max(...STATUSES.map((s) => statusCounts[s]));

  const appliedPlus =
    statusCounts.applied + statusCounts.interview + statusCounts.offer + statusCounts.rejected;
  const responded = statusCounts.interview + statusCounts.offer + statusCounts.rejected;
  const responseRate = pct(responded, appliedPlus);
  const offerRate = pct(statusCounts.offer, appliedPlus);

  const providerCounts = new Map<string, number>();
  for (const job of jobs) {
    providerCounts.set(job.provider, (providerCounts.get(job.provider) ?? 0) + 1);
  }
  const providers = [...providerCounts.entries()].sort((a, b) => b[1] - a[1]);
  const maxProviderCount = Math.max(...providers.map(([, c]) => c));

  const matchCounts = { high: 0, medium: 0, low: 0, unscored: 0 };
  for (const job of jobs) {
    matchCounts[matchBucket(job.match_score)]++;
  }
  const maxMatchCount = Math.max(...Object.values(matchCounts));

  const WEEKS = 8;
  const thisWeekStart = startOfWeek(new Date());
  const weekBuckets = Array.from({ length: WEEKS }, (_, i) => {
    const start = new Date(thisWeekStart);
    start.setDate(start.getDate() - (WEEKS - 1 - i) * 7);
    return { start, count: 0 };
  });
  for (const job of jobs) {
    const wk = startOfWeek(new Date(job.scraped_at)).getTime();
    const bucket = weekBuckets.find((b) => b.start.getTime() === wk);
    if (bucket) bucket.count++;
  }
  const maxWeekCount = Math.max(1, ...weekBuckets.map((b) => b.count));

  return (
    <div className={styles.page}>
      <AppHeader />
      <div className={styles.container}>
        <h1 className={styles.title}>Analytics</h1>
        <p className={styles.subtitle}>Based on {total} saved job{total === 1 ? '' : 's'}</p>

        <div className={styles.statGrid}>
          <div className={styles.statTile}>
            <span className={styles.statTileValue}>{total}</span>
            <span className={styles.statTileLabel}>Jobs saved</span>
          </div>
          <div className={styles.statTile}>
            <span className={styles.statTileValue}>{appliedPlus}</span>
            <span className={styles.statTileLabel}>
              Applied &middot; {pct(appliedPlus, total)}% of saved
            </span>
          </div>
          <div className={styles.statTile}>
            <span className={styles.statTileValue}>{responseRate}%</span>
            <span className={styles.statTileLabel}>
              Response rate &middot; {responded} of {appliedPlus} applied
            </span>
          </div>
          <div className={styles.statTile}>
            <span className={styles.statTileValue}>{statusCounts.offer}</span>
            <span className={styles.statTileLabel}>Offers &middot; {offerRate}% of applied</span>
          </div>
        </div>

        <div className={styles.grid}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Status breakdown</h2>
            <div className={styles.barChart}>
              {STATUSES.map((s) => (
                <Bar
                  key={s}
                  label={s}
                  count={statusCounts[s]}
                  total={total}
                  max={maxStatusCount}
                  color={STATUS_COLOR[s]}
                />
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Source mix</h2>
            <div className={styles.barChart}>
              {providers.map(([provider, count]) => (
                <Bar
                  key={provider}
                  label={provider}
                  count={count}
                  total={total}
                  max={maxProviderCount}
                  color={PROVIDER_COLOR[provider] ?? PROVIDER_DEFAULT_COLOR}
                />
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Resume match distribution</h2>
            <div className={styles.barChart}>
              <Bar
                label='strong'
                count={matchCounts.high}
                total={total}
                max={maxMatchCount}
                color={MATCH_COLOR.high}
              />
              <Bar
                label='moderate'
                count={matchCounts.medium}
                total={total}
                max={maxMatchCount}
                color={MATCH_COLOR.medium}
              />
              <Bar
                label='weak'
                count={matchCounts.low}
                total={total}
                max={maxMatchCount}
                color={MATCH_COLOR.low}
              />
              <Bar
                label='not scored'
                count={matchCounts.unscored}
                total={total}
                max={maxMatchCount}
                color={MATCH_COLOR.unscored}
              />
            </div>
          </section>

          <section className={`${styles.card} ${styles.cardWide}`}>
            <h2 className={styles.cardTitle}>Jobs saved per week</h2>
            <div className={styles.weekChart}>
              <span className={styles.weekAxisTick}>{maxWeekCount}</span>
              {weekBuckets.map((b) => (
                <div key={b.start.toISOString()} className={styles.weekBar}>
                  <span className={styles.weekValue}>{b.count || ''}</span>
                  <div className={styles.weekTrack}>
                    <div
                      className={styles.weekFill}
                      style={{ height: `${(b.count / maxWeekCount) * 100}%` }}
                    />
                  </div>
                  <span className={styles.weekLabel}>{weekLabel(b.start)}</span>
                </div>
              ))}
              <span className={styles.weekAxisTickZero}>0</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
