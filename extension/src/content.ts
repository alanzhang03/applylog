import {
  detectProvider,
  isJobPostingUrl,
  type ATSProvider,
  type ScrapedJob,
} from '@autotrack/shared';

function text(selector: string): string {
  return document.querySelector(selector)?.textContent?.trim() ?? '';
}

function sanitize(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}

function innerHtml(selector: string): string {
  const el = document.querySelector(selector);
  return el ? sanitize(el.innerHTML) : '';
}

function scrapeGreenhouse(): Partial<ScrapedJob> {
  const companyFromTitle =
    document.title.match(/\bat\s+(.+)$/i)?.[1]?.trim() ?? '';
  return {
    title: text('.app-title') || text('h1'),
    company: companyFromTitle,
    description: innerHtml('#content') || innerHtml('.job__description'),
  };
}

function scrapeWorkday(): Partial<ScrapedJob> {
  const host = new URL(location.href).hostname;
  const company = host.split('.wd')[0];
  return {
    title: text('[data-automation-id="jobPostingHeader"]') || document.title.split(' - ')[0].trim(),
    company,
    description: innerHtml('[data-automation-id="jobPostingDescription"]'),
  };
}

function scrapeLever(): Partial<ScrapedJob> {
  const company = new URL(location.href).pathname.split('/')[1] ?? '';
  const descEl = document.querySelector('[data-qa="job-description"]');
  let description = '';
  if (descEl) {
    const clone = descEl.cloneNode(true) as Element;
    clone.querySelectorAll('[class*="simplify"]').forEach((el) => el.remove());
    description = sanitize(clone.innerHTML);
  }
  return {
    title: text('.posting-headline h2') || text('h2'),
    company,
    description,
  };
}

function ashbyDescriptionFromDoc(doc: Document): string {
  const panel =
    doc.querySelector('[aria-labelledby="job-overview"]') ??
    doc.querySelector('#overview');
  if (!panel) return '';
  const clone = panel.cloneNode(true) as Element;
  clone.querySelectorAll('[class*="simplify"]').forEach((el) => el.remove());
  return sanitize(clone.innerHTML);
}

function scrapeAshby(): Partial<ScrapedJob> {
  return {
    title: text('h1'),
    company:
      text('[class*="companyName"]') ||
      document.title.split('@').pop()?.trim() ||
      '',
    description: ashbyDescriptionFromDoc(document),
  };
}

async function ashbyDescriptionViaTabSwitch(): Promise<string> {
  const tabs = [...document.querySelectorAll<HTMLElement>('[role="tab"]')];
  const overviewTab = tabs.find((t) => t.textContent?.trim() === 'Overview');
  const appTab = tabs.find((t) => t.textContent?.trim() === 'Application');
  if (!overviewTab) return '';

  overviewTab.click();
  await new Promise((r) => setTimeout(r, 400));
  const description = ashbyDescriptionFromDoc(document);
  appTab?.click();
  return description;
}

function canonicalUrl(provider: ATSProvider): string {
  const base = location.href.split('?')[0];
  if (provider === 'lever') return base.replace(/\/apply$/, '');
  if (provider === 'ashby') return base.replace(/\/application$/, '');
  return base;
}

function scrape(provider: ATSProvider): ScrapedJob {
  const scrapers = {
    greenhouse: scrapeGreenhouse,
    lever: scrapeLever,
    ashby: scrapeAshby,
    workday: scrapeWorkday,
  };
  const fields = scrapers[provider]();
  return {
    title: fields.title ?? '',
    company: fields.company ?? '',
    description: fields.description ?? '',
    url: canonicalUrl(provider),
    provider,
  };
}

const NON_JOB_TITLE_PATTERNS = [
  /^thank you for applying/i,
  /^create( your)? account/i,
  /^sign in$/i,
  /^log ?in$/i,
  /^application (submitted|received|confirmation)/i,
  /^review your application/i,
  /^my applications?$/i,
];

function isLikelyJobPosting(job: ScrapedJob): boolean {
  const title = job.title.trim();
  if (!title) return false;
  return !NON_JOB_TITLE_PATTERNS.some((pattern) => pattern.test(title));
}

function tryRun(provider: ATSProvider): ScrapedJob | null {
  const job = scrape(provider);
  return job.title ? job : null;
}

const provider = detectProvider(location.href);
console.log('[AutoTrack] content: provider =', provider, 'url =', location.href);

if (!provider) {
  console.log('[AutoTrack] content: no provider detected for this host, skipping');
} else if (!isJobPostingUrl(location.href)) {
  console.log('[AutoTrack] content: url did not match job posting pattern, skipping');
} else {
  (async () => {
    let job = tryRun(provider);
    console.log('[AutoTrack] content: first scrape attempt', job);

    if (!job) {
      console.log('[AutoTrack] content: no title on first attempt, retrying in 2s');
      await new Promise((r) => setTimeout(r, 2000));
      job = scrape(provider);
      console.log('[AutoTrack] content: retry scrape result', job);
    }

    if (provider === 'ashby' && !job.description) {
      console.log('[AutoTrack] content: ashby description empty, trying tab switch');
      job.description = await ashbyDescriptionViaTabSwitch();
      console.log('[AutoTrack] content: ashby description after tab switch', job.description.length, 'chars');
    }

    if (isLikelyJobPosting(job)) {
      console.log('[AutoTrack] content: sending scraped job to background', job);
      chrome.runtime.sendMessage(job);
    } else {
      console.log('[AutoTrack] content: job failed isLikelyJobPosting check, not sending', job);
    }
  })();
}
