# ApplyLog

Automatically track your job applications across the web.

ApplyLog is a Chrome Extension + Next.js dashboard that saves job postings as you browse, detects when you've applied via Gmail, and keeps everything organized in one place.

## Features

- **Auto-scraping** — Chrome extension captures job title, company, and description as you browse job postings on Greenhouse, Lever, Ashby, and Workday
- **Gmail sync** — detects application confirmation emails and automatically marks matched jobs as applied
- **Dashboard** — view all saved jobs with status, source, and full description at [applylog.dev](https://applylog.dev)
- **Status tracking** — manually update jobs through saved → applied → screen → interview → offer → rejected

## Stack

- **Extension**: Chrome Manifest V3, TypeScript, Vite
- **Dashboard**: Next.js, SCSS Modules, Supabase
- **Auth**: Google OAuth 2.0 (PKCE flow for extension, SSR session for web)
- **Database**: Supabase (Postgres with Row Level Security)

## Setup

### Web dashboard

```bash
cd web
npm install
```

Create `web/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
npm run dev
```

### Extension

```bash
cd extension
npm install
```

Create `extension/.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
npm run build
```

Load the `extension/dist` folder as an unpacked extension in `chrome://extensions`.
