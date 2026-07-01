import { supabase } from '@/lib/supabase';
import StatusSelect from './components/StatusSelect';

type Job = {
  id: string;
  url: string;
  title: string;
  company: string;
  provider: string;
  status: string;
  scraped_at: string;
};

const PROVIDER_COLORS: Record<string, string> = {
  greenhouse: 'bg-emerald-100 text-emerald-700',
  lever:      'bg-blue-100 text-blue-700',
  ashby:      'bg-violet-100 text-violet-700',
};

export default async function Home() {
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, url, title, company, provider, status, scraped_at')
    .order('scraped_at', { ascending: false });

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-red-500 text-sm">Failed to load: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Job Tracker</h1>
          <p className="text-sm text-zinc-400 mt-1">{jobs?.length ?? 0} jobs saved</p>
        </div>

        {!jobs?.length ? (
          <div className="rounded-xl border border-zinc-200 bg-white px-6 py-16 text-center">
            <p className="text-zinc-400 text-sm">No jobs yet — browse a job posting to get started.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="text-left px-5 py-3 font-medium text-zinc-400 text-xs uppercase tracking-wide">Company</th>
                  <th className="text-left px-5 py-3 font-medium text-zinc-400 text-xs uppercase tracking-wide">Role</th>
                  <th className="text-left px-5 py-3 font-medium text-zinc-400 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 font-medium text-zinc-400 text-xs uppercase tracking-wide">Source</th>
                  <th className="text-left px-5 py-3 font-medium text-zinc-400 text-xs uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {jobs.map((job: Job) => (
                  <tr key={job.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-zinc-900 whitespace-nowrap">{job.company}</td>
                    <td className="px-5 py-4 text-zinc-600 max-w-xs truncate">{job.title}</td>
                    <td className="px-5 py-4">
                      <StatusSelect id={job.id} status={job.status} />
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${PROVIDER_COLORS[job.provider] ?? 'bg-zinc-100 text-zinc-600'}`}>
                        {job.provider}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-zinc-400 whitespace-nowrap">
                      {new Date(job.scraped_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-zinc-400 hover:text-zinc-900 transition-colors"
                      >
                        View →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
