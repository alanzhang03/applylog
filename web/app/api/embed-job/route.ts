import { embed } from '@/lib/embeddings';
import { createClient } from '@supabase/supabase-js';
import { cosineSimilarity } from '@/lib/similarity';

export async function POST(request: Request) {
  const secret = request.headers.get('x-webhook-secret');
  if (secret !== process.env.EMBED_WEBHOOK_SECRET) {
    return new Response(null, { status: 401 });
  }
  const body = await request.json();
  const id = body.record.id;
  const desc = body.record.description;
  const user_id = body.record.user_id;
  const text = desc
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const jobEmbedding = (await embed([text]))[0];

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: resume } = await supabase
    .from('resumes')
    .select('id, embedding')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!resume || !resume.embedding) {
    await supabase
      .from('jobs')
      .update({ embedding: jobEmbedding })
      .eq('id', id);
    return new Response(null, { status: 200 });
  }
  const resumeEmbedding = JSON.parse(resume.embedding as unknown as string);
  const matchScore = cosineSimilarity(jobEmbedding, resumeEmbedding);

  const { error } = await supabase
    .from('jobs')
    .update({
      embedding: jobEmbedding,
      resume_id: resume.id,
      match_score: matchScore,
    })
    .eq('id', id);
  if (error) {
    throw new Error(`error: ${error}`);
  }
  return new Response(null, { status: 200 });
}
