import { embed } from '@/lib/embeddings';
import { createClient } from '@supabase/supabase-js';

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
}
