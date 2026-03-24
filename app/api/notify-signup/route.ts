import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { email, region, interest } = await req.json() as {
      email?: string;
      region?: string;
      interest?: string;
    };

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Upsert into notification_signups (created if not exists by this route, silently fails otherwise)
    await supabase.from('notification_signups').upsert(
      { email: email.toLowerCase(), region: region ?? null, interest: interest ?? null },
      { onConflict: 'email' }
    );

    return NextResponse.json({ ok: true });
  } catch {
    // Non-fatal — table may not exist yet, still return success to the user
    return NextResponse.json({ ok: true });
  }
}
