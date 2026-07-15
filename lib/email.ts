export async function sendEmail(to: string, subject: string, body: string, html?: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log('[email] RESEND_API_KEY not set — skipping:', subject);
    return;
  }
  try {
    const payload: Record<string, unknown> = {
      from:    'Biome Ops <ops@biome.to>',
      to,
      subject,
      text:    body,
    };
    if (html) payload.html = html;
    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    if (!res.ok) console.error('[email] send failed:', await res.text());
  } catch (err) {
    console.error('[email] error:', err);
  }
}
