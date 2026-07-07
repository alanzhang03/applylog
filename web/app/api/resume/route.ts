import { createClient } from '@/lib/supabase-server';
import { embed } from '@/lib/embeddings';
import { isOwner } from '@/lib/auth';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(null, { status: 401 });
  }
  if (!isOwner(user.email)) {
    return new Response(null, { status: 403 });
  }

  const { content } = await request.json();
  const embedding = (await embed([content]))[0];
  const { error } = await supabase
    .from('resumes')
    .insert({ user_id: user.id, content, embedding });
  if (error) {
    throw new Error(`error: ${error}`);
  }
  return new Response(null, { status: 200 });
}
