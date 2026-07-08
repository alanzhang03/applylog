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

  const formData = await request.formData();
  const content = formData.get('content') as string;
  const file = formData.get('file');

  const embedding = (await embed([content]))[0];
  let filePath: string | null = null;
  if (file instanceof File) {
    filePath = `${user.id}/${crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, file, { contentType: 'application/pdf' });
    if (uploadError) {
      throw new Error(`upload error: ${uploadError.message}`);
    }
  }

  const { error } = await supabase
    .from('resumes')
    .insert({ user_id: user.id, content, embedding, file_path: filePath });
  if (error) {
    throw new Error(`error: ${error}`);
  }
  return new Response(null, { status: 200 });
}
