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

    // Acknowledgment to the sender.
    await sendEmail(
      email.toLowerCase(),
      'We received your message — BIOME',
      `Hi ${name},\n\n` +
      `Thanks for reaching out about ${organization}'s study. Your message is with our team ` +
      `and a real person will reply within one business day.\n\n` +
      `In the meantime, you can get an instant cost picture with our study estimator:\n` +
      `https://biome.to/estimate\n\n` +
      `— The BIOME team\nhello@biome.to`,
      `<!DOCTYPE html><html><body style="margin:0;background:#f8fafc;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;"><tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
            <tr><td style="background:#0e7490;padding:28px 36px;">
              <div style="font-size:20px;font-weight:700;color:#fff;letter-spacing:1px;">BIOME</div>
              <div style="font-size:12px;color:rgba(255,255,255,.8);margin-top:4px;text-transform:uppercase;letter-spacing:1px;">Message received</div>
            </td></tr>
            <tr><td style="padding:32px 36px;">
              <p style="margin:0;font-size:16px;color:#0f172a;">Hi ${name},</p>
              <p style="margin:14px 0 0;font-size:15px;color:#475569;line-height:1.6;">Thanks for reaching out about <strong>${organization}</strong>&rsquo;s study. Your message is with our team and a real person will reply within one business day.</p>
              <p style="margin:14px 0 0;font-size:14px;color:#475569;line-height:1.6;">Want an instant cost picture in the meantime?</p>
              <div style="margin:20px 0 0;"><a href="https://biome.to/estimate" style="display:inline-block;background:#0e7490;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 26px;border-radius:8px;">Try the study estimator →</a></div>
            </td></tr>
            <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 36px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">The BIOME team · <a href="mailto:hello@biome.to" style="color:#0e7490;text-decoration:none;">hello@biome.to</a></p>
            </td></tr>
          </table>
        </td></tr></table>
      </body></html>`,
    ).catch((e: unknown) => console.error('[contact] ack email failed:', e));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact]', err);
    return NextResponse.json({ error: 'Something went wrong — please email hello@biome.to' }, { status: 500 });
  }
}
