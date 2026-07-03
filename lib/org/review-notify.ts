// Notifies an org's founding user when ops approves or rejects their
// organization — in-app notification + email. Used by both the ops
// approvals page (server action) and the PATCH API.

import { createServiceClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

type Db = ReturnType<typeof createServiceClient>;

export async function notifyOrgReview(
  db: Db,
  userId: string,
  decision: 'active' | 'rejected',
  siteBase: string,
): Promise<void> {
  // Org name + id for the message and email-fallback lookup.
  const { data: orgRaw } = await db
    .from('experimenter_profiles')
    .select('id, org_name')
    .eq('user_id', userId)
    .maybeSingle();
  const org = orgRaw as { id: string; org_name: string } | null;
  const orgName = org?.org_name ?? 'your organization';

  // Resolve the recipient email: base profile first, then the invite record.
  let email: string | null = null;
  const { data: prof } = await db.from('profiles').select('email').eq('id', userId).maybeSingle();
  email = (prof as { email: string | null } | null)?.email ?? null;
  if (!email && org) {
    const { data: inv } = await db
      .from('org_invites').select('email').eq('created_org_id', org.id).maybeSingle();
    email = (inv as { email: string } | null)?.email ?? null;
  }

  const approved = decision === 'active';
  const title = approved
    ? `${orgName} is approved on BIOME`
    : `Update on your BIOME organization application`;
  const message = approved
    ? 'Your organization has been reviewed and approved. You can now post and manage studies from your researcher dashboard.'
    : 'After review we are not able to approve your organization at this time. Reply to this email if you would like to discuss.';

  // In-app notification (shows in the bell + dashboard inbox).
  await db.from('notifications').insert({
    user_id: userId,
    type:    'org_review',
    payload: { title, message },
    read:    false,
  }).then(() => undefined, (e) => console.error('[org-review] notification', e));

  if (!email) return; // nothing more we can do

  const dashUrl = `${siteBase.replace(/\/$/, '')}/dashboard/experiments`;
  await sendEmail(
    email,
    title,
    approved
      ? `Good news — ${orgName} has been approved on BIOME.\n\n` +
        `You can now post and manage studies from your researcher dashboard:\n${dashUrl}\n\n` +
        `— The BIOME team\nhello@biome.to`
      : `Thank you for your interest in running studies on BIOME.\n\n` +
        `After review, we are not able to approve ${orgName} at this time. ` +
        `If you believe this is a mistake or want to discuss, just reply to this email.\n\n` +
        `— The BIOME team\nhello@biome.to`,
    approved
      ? `<!DOCTYPE html><html><body style="margin:0;background:#f8fafc;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;"><tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
              <tr><td style="background:#0e7490;padding:28px 36px;">
                <div style="font-size:20px;font-weight:700;color:#fff;letter-spacing:1px;">BIOME</div>
                <div style="font-size:12px;color:rgba(255,255,255,.8);margin-top:4px;text-transform:uppercase;letter-spacing:1px;">Organization approved</div>
              </td></tr>
              <tr><td style="padding:32px 36px;">
                <p style="margin:0;font-size:16px;color:#0f172a;">Good news —</p>
                <p style="margin:14px 0 0;font-size:15px;color:#475569;line-height:1.6;"><strong>${orgName}</strong> has been reviewed and approved on BIOME. You can now post studies, attach approval documents, invite your team, and manage everything from your researcher dashboard.</p>
                <div style="margin:26px 0 0;"><a href="${dashUrl}" style="display:inline-block;background:#0e7490;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:13px 28px;border-radius:8px;">Open researcher dashboard →</a></div>
              </td></tr>
              <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 36px;">
                <p style="margin:0;font-size:12px;color:#94a3b8;">The BIOME team · <a href="mailto:hello@biome.to" style="color:#0e7490;text-decoration:none;">hello@biome.to</a></p>
              </td></tr>
            </table>
          </td></tr></table>
        </body></html>`
      : undefined,
  );
}
