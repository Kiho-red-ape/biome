import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getRecipient } from '@/lib/trolley';

// GET /api/payout/status?privyDid=...
// Called when participant returns from Trolley onboarding.
// Fetches live recipient status from Trolley and syncs to DB.
export async function GET(req: NextRequest) {
  const privyDid = req.nextUrl.searchParams.get('privyDid');
  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const supabase = createServiceClient();

  const { data: pp } = await supabase
    .from('participant_profiles')
    .select('user_id, trolley_recipient_id, payout_method_configured, payout_method_type')
    .eq('user_id', privyDid)
    .single();

  if (!pp) return NextResponse.json({ error: 'Participant profile not found' }, { status: 404 });
  if (!pp.trolley_recipient_id) {
    return NextResponse.json({ configured: false, method: null });
  }

  try {
    const recipient = await getRecipient(pp.trolley_recipient_id);

    const isActive = recipient.status === 'active';
    const method   = recipient.payoutMethod ?? null;

    // Sync to DB if status changed
    if (isActive !== pp.payout_method_configured || method !== pp.payout_method_type) {
      await supabase
        .from('participant_profiles')
        .update({
          payout_method_configured: isActive,
          payout_method_type:       method,
        })
        .eq('user_id', privyDid);
    }

    return NextResponse.json({
      configured: isActive,
      method,
      recipientStatus: recipient.status,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch recipient';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
