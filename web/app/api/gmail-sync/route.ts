import { createClient } from '@supabase/supabase-js';
import { syncGmailForUser } from '@/lib/gmail';

export async function POST(request: Request) {
  const secret = request.headers.get('x-webhook-secret');
  if (secret !== process.env.GMAIL_SYNC_SECRET) {
    return new Response(null, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: tokens } = await supabase
    .from('gmail_tokens')
    .select('user_id, refresh_token');

  for (const { user_id, refresh_token } of tokens ?? []) {
    await syncGmailForUser(supabase, user_id, refresh_token);
  }

  return new Response(null, { status: 200 });
}
