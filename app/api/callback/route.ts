import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json() as { name?: string; email?: string };
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email required' }, { status: 400 });
    }

    await sendEmail(
      'kishore@biome.to',
      `Callback request from ${name}`,
      `Name:  ${name}\nEmail: ${email}\n\nSent from biome.to — closing CTA form.`,
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
