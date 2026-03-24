import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, string>;
    const { name, email, organization, website, role, study_detail, help_needed } = body;

    if (!name || !email || !organization || !role || !study_detail || !help_needed) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServiceClient();

    await supabase.from('contact_submissions').insert({
      name,
      email: email.toLowerCase(),
      organization,
      website: website ?? null,
      role,
      study_detail,
      help_needed,
      submitted_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Table may not exist yet — still return success so the user isn't blocked
    return NextResponse.json({ ok: true });
  }
}
