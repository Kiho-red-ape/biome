import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

// Contact-us submissions feed the SAME pipeline as every other lead channel:
// a client_intakes row (triaged + invitable in ops) plus an ops email.
// contact_submissions is kept as a best-effort raw archive.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, string>;
    const { name, email, organization, website, role, study_detail, help_needed } = body;

    if (!name || !email || !organization || !role || !study_detail || !help_needed) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Raw archive (best-effort — table may not exist in older environments).
    await supabase.from('contact_submissions').insert({
      name,
      email: email.toLowerCase(),
      organization,
      website: website ?? null,
      role,
      study_detail,
      help_needed,
      submitted_at: new Date().toISOString(),
    }).then(() => undefined, () => undefined);

    // The lead that ops actually works: a pipeline intake.
    const { error: intakeErr } = await supabase.from('client_intakes').insert({
      name,
      organization,
      email:           email.toLowerCase(),
      website:         website ?? null,
      study_title:     `Contact enquiry — ${organization}`,
      description:     `Role: ${role}\n\nStudy detail:\n${study_detail}\n\nHelp needed:\n${help_needed}`,
      referral_source: 'contact_form',
      triage_status:   'new',
    });
    if (intakeErr) console.error('[contact] intake insert failed:', intakeErr.message);

    // Ops heads-up.
    await sendEmail(
      'hello@biome.to',
      `New contact enquiry — ${organization}`,
      `Name: ${name}\nEmail: ${email}\nOrganization: ${organization}\nWebsite: ${website ?? '—'}\nRole: ${role}\n\n` +
      `Study detail:\n${study_detail}\n\nHelp needed:\n${help_needed}\n\n` +
      `Triage it in the pipeline: /ops/intakes`,
    ).catch((e: unknown) => console.error('[contact] ops email failed:', e));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact]', err);
    return NextResponse.json({ error: 'Something went wrong — please email hello@biome.to' }, { status: 500 });
  }
}
