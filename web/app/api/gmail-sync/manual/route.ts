import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient as createUserClient } from '@/lib/supabase-server';
import { syncGmailForUser } from '@/lib/gmail';

export async function POST() {
  const userClient = await createUserClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();

  if (!user) {
    return new Response(null, { status: 401 });
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: tokenRow } = await serviceClient
    .from('gmail_tokens')
    .select('refresh_token')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!tokenRow) {
    return new Response(null, { status: 404 });
  }

  await syncGmailForUser(serviceClient, user.id, tokenRow.refresh_token);

  return new Response(null, { status: 200 });
}
