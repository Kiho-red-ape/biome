// POST /api/ops/intakes/invite  { intakeId, operatorPrivyDid }
// Replaces the old auto-create "Activate". Sends the real researcher an invite
// (email + link) to self-onboard and build their org profile. Idempotent: if an
// active invite already exists for the intake, returns it.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { generateToken } from '@/lib/org/invites';

const schema = z.object({
  intakeId:         z.string().uuid(),
  operatorPrivyDid: z.string().min(1),
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://biome.to';

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof schema>;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'intakeId and operatorPrivyDid required' }, { status: 400 });
  }

  const { intakeId, operatorPrivyDid } = parsed;
  const db = createServiceClient();

  const { data: intakeRaw, error: intakeErr } = await db
    .from('client_intakes')
    .select('id, name, organization, email, org_invite_id')
    .eq('id', intakeId)
    .maybeSingle();

  if (intakeErr) return NextResponse.json({ error: intakeErr.message }, { status: 500 });
  if (!intakeRaw) return NextResponse.json({ error: 'Intake not found' }, { status: 404 });

  const intake = intakeRaw as {
    id: string; name: string | null; organization: string | null;
    email: string | null; org_invite_id: string | null;
  };
  if (!intake.email) return NextResponse.json({ error: 'Intake has no email to invite' }, { status: 400 });

  // Idempotent: reuse an existing outstanding invite.
  if (intake.org_invite_id) {
    const { data: existing } = await db
      .from('org_invites').select('invite_token, status').eq('id', intake.org_invite_id).maybeSingle();
    const ex = existing as { invite_token: string; status: string } | null;
    if (ex && ex.status === 'sent') {
      return NextResponse.json({ inviteToken: ex.invite_token, link: `${SITE}/invite/${ex.invite_token}`, reused: true });
    }
  }

  const token   = generateToken();
  const expires = new Date(Date.now() + 14 * 86_400_000).toISOString();

  const { data: inviteRow, error: invErr } = await db
    .from('org_invites')
    .insert({
      intake_id:    intake.id,
      email:        intake.email.toLowerCase(),
      org_name:     intake.organization ?? null,
      contact_name: intake.name ?? null,
      invite_token: token,
      invited_by:   operatorPrivyDid,
      expires_at:   expires,
    })
    .select('id')
    .single();

  if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 });

  const now = new Date().toISOString();
  await db.from('client_intakes')
    .update({ org_invite_id: (inviteRow as { id: string }).id, invited_at: now, triage_status: 'qualified', triaged_at: now })
    .eq('id', intake.id);

  const link = `${SITE}/invite/${token}`;
  const orgLabel = intake.organization ?? 'your organization';

  await sendEmail(
    intake.email.toLowerCase(),
    'You are invited to set up your organization on BIOME',
    `Hi${intake.name ? ` ${intake.name}` : ''},\n\n` +
    `Your study is moving forward with BIOME. The next step is to create your organization profile for ${orgLabel} — ` +
    `this lets you post and manage your study, attach approval documents, and invite your team.\n\n` +
    `Get started here:\n${link}\n\n` +
    `This link is unique to you and expires in 14 days.\n\n` +
    `— The BIOME team\nhello@biome.to`,
    `<!DOCTYPE html><html><body style="margin:0;background:#f8fafc;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;"><tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
          <tr><td style="background:#0e7490;padding:28px 36px;"><div style="font-size:20px;font-weight:700;color:#fff;letter-spacing:1px;">BIOME</div>
            <div style="font-size:12px;color:rgba(255,255,255,.8);margin-top:4px;text-transform:uppercase;letter-spacing:1px;">Organization invitation</div></td></tr>
          <tr><td style="padding:32px 36px;">
            <p style="margin:0;font-size:16px;color:#0f172a;">Hi${intake.name ? ` ${intake.name}` : ''},</p>
            <p style="margin:16px 0 0;font-size:15px;color:#475569;line-height:1.6;">Your study is moving forward with BIOME. The next step is to set up the organization profile for <strong>${orgLabel}</strong> — so you can post and manage your study, attach approval documents, and invite your team.</p>
            <div style="margin:28px 0;"><a href="${link}" style="display:inline-block;background:#0e7490;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:13px 28px;border-radius:8px;">Set up your organization →</a></div>
            <p style="margin:0;font-size:13px;color:#94a3b8;">This link is unique to you and expires in 14 days.</p>
          </td></tr>
          <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 36px;"><p style="margin:0;font-size:12px;color:#94a3b8;">The BIOME team · <a href="mailto:hello@biome.to" style="color:#0e7490;text-decoration:none;">hello@biome.to</a></p></td></tr>
        </table>
      </td></tr></table>
    </body></html>`,
  );

  return NextResponse.json({ inviteToken: token, link });
}
