import { Resend } from 'npm:resend';
import { handleRequest } from './handler.ts';

Deno.serve(async (req) => {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ ok: false, error: 'RESEND_API_KEY not configured' }),
      { status: 500 },
    );
  }

  const resend = new Resend(apiKey);

  const params = await req.json();
  const result = await handleRequest(params, (opts) =>
    resend.emails.send(opts) as Promise<{ error?: { message: string } }>
  );

  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
