import {
  detectProvider,
  isJobPostingUrl,
  type ATSProvider,
  type ScrapedJob,
} from '@autotrack/shared';

function text(selector: string): string {
  return document.querySelector(selector)?.textContent?.trim() ?? '';
}

function scrapeGreenhouse(): Partial<ScrapedJob> {
  return {
    title: text('.app-title') || text('h1'),
    company: text('.company-name') || document.title.split('-').pop()?.trim() || '',
    description: text('#content') || text('.job__description'),
  };
}

function scrapeLever(): Partial<ScrapedJob> {
  return {
    title: text('.posting-headline h2') || text('h2'),
    company: text('[class*="main-header-logo"] img') || text('[class*="company"]'),
    description: text('.section-wrapper.page-full-width') || text('.content'),
  };
}

function scrapeAshby(): Partial<ScrapedJob> {
  return {
    title: text('h1'),
    company: text('[class*="companyName"]') || document.title.split('@').pop()?.trim() || '',
    description: text('[class*="jobDescription"]') || text('main'),
  };
}

function scrape(provider: ATSProvider): ScrapedJob {
  const scrapers = {
    greenhouse: scrapeGreenhouse,
    lever: scrapeLever,
    ashby: scrapeAshby,
  };
  const fields = scrapers[provider]();
  return {
    title: fields.title ?? '',
    company: fields.company ?? '',
    description: fields.description ?? '',
    url: location.href,
    provider,
  };
}

const provider = detectProvider(location.href);
if (provider && isJobPostingUrl(location.href)) {
  console.log('[AutoTrack] scraped job', scrape(provider));
}
