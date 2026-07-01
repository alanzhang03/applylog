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

export default async function Home() {
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, url, title, company, provider, status, scraped_at')
    .order('scraped_at', { ascending: false });

  if (error) {
    return <div className="p-8 text-red-500">Failed to load jobs: {error.message}</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Job Tracker</h1>
        <p className="text-zinc-500 mt-1">{jobs?.length ?? 0} jobs saved</p>
      </div>

      {!jobs?.length ? (
        <p className="text-zinc-400">No jobs yet — browse a job posting to get started.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left">
              <th className="pb-3 font-medium text-zinc-500">Company</th>
              <th className="pb-3 font-medium text-zinc-500">Role</th>
              <th className="pb-3 font-medium text-zinc-500">Status</th>
              <th className="pb-3 font-medium text-zinc-500">Date</th>
              <th className="pb-3 font-medium text-zinc-500">Source</th>
              <th className="pb-3 font-medium text-zinc-500">Link</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job: Job) => (
              <tr key={job.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="py-3 font-medium text-zinc-900">{job.company}</td>
                <td className="py-3 text-zinc-600">{job.title}</td>
                <td className="py-3">
                  <StatusSelect id={job.id} status={job.status} />
                </td>
                <td className="py-3 text-zinc-400">
                  {new Date(job.scraped_at).toLocaleDateString()}
                </td>
                <td className="py-3 text-zinc-400 capitalize">{job.provider}</td>
                <td className="py-3">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
