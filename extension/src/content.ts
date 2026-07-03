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

function tryRun(provider: ATSProvider): ScrapedJob | null {
  const job = scrape(provider);
  return job.title ? job : null;
}

const provider = detectProvider(location.href);
if (provider && isJobPostingUrl(location.href)) {
  (async () => {
    let job = tryRun(provider);
    if (!job) {
      await new Promise((r) => setTimeout(r, 2000));
      job = scrape(provider);
    }

    if (provider === 'ashby' && !job.description) {
      job.description = await ashbyDescriptionViaTabSwitch();
    }

    chrome.runtime.sendMessage(job);
  })();
}
