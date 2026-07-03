import type { ATSProvider } from './types.ts';

export function detectProvider(url: string): ATSProvider | null {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return null;
  }

  if (host.endsWith('greenhouse.io')) return 'greenhouse';
  if (host.endsWith('lever.co')) return 'lever';
  if (host.endsWith('ashbyhq.com')) return 'ashby';
  if (host.endsWith('myworkdayjobs.com')) return 'workday';
  return null;
}

export function isJobPostingUrl(url: string): boolean {
  const provider = detectProvider(url);
  if (!provider) return false;

  switch (provider) {
    case 'greenhouse':
      return /\/jobs\/\d+/.test(url);
    case 'lever':
      return /lever\.co\/[^/]+\/[0-9a-f-]{20,}/i.test(url);
    case 'ashby':
      return /ashbyhq\.com\/[^/]+\/[0-9a-f-]{20,}/i.test(url);
    case 'workday':
      return /\/job\//.test(url);
  }
}
