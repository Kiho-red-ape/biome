// GET /api/invites/[token]  → public invite details for the accept page.
// Returns enough to greet the invitee and prefill onboarding; never leaks
// operator identity or other intake data.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const db = createServiceClient();

  const { data } = await db
    .from('org_invites')
    .select('email, org_name, contact_name, status, expires_at, created_org_id')
    .eq('invite_token', token)
    .maybeSingle();

  if (!data) return NextResponse.json({ valid: false, reason: 'not_found' });

  const inv = data as {
    email: string; org_name: string | null; contact_name: string | null;
    status: string; expires_at: string | null; created_org_id: string | null;
  };

  const expired = inv.expires_at ? new Date(inv.expires_at).getTime() < Date.now() : false;
  if (inv.status === 'accepted') {
    return NextResponse.json({ valid: false, reason: 'accepted', orgId: inv.created_org_id });
  }
  if (inv.status === 'revoked' || expired) {
    return NextResponse.json({ valid: false, reason: expired ? 'expired' : 'revoked' });
  }

  return NextResponse.json({
    valid: true,
    email:       inv.email,
    orgName:     inv.org_name,
    contactName: inv.contact_name,
  });
}
