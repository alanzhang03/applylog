import { createClient } from '@/lib/supabase-server';
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
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return new Response(JSON.stringify({ error: 'No file uploaded' }), {
      status: 400,
    });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: 'Extract all text content from this resume PDF exactly as written, preserving reading order (left-to-right, top-to-bottom per column). Return only the extracted text, with no commentary or formatting markup.',
            },
            {
              type: 'input_file',
              filename: file.name,
              file_data: `data:application/pdf;base64,${base64}`,
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    return new Response(
      JSON.stringify({ error: `Extraction failed (${res.status}): ${await res.text()}` }),
      { status: 502 },
    );
  }

  const data = await res.json();
  const message = data.output?.find(
    (item: { type: string }) => item.type === 'message',
  );
  const text =
    message?.content?.find(
      (c: { type: string }) => c.type === 'output_text',
    )?.text ?? '';

  return new Response(JSON.stringify({ text }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
