export type ATSProvider = 'greenhouse' | 'lever' | 'ashby' | 'workday';

export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'interview'
  | 'offer'
  | 'rejected';

export interface ScrapedJob {
  company: string;
  title: string;
  description: string;
  url: string;
  provider: ATSProvider;
}

export interface Job extends ScrapedJob {
  id: string;
  status: ApplicationStatus;
  description: string;
  scrapedAt: string;
}
