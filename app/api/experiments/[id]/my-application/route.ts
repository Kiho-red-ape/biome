import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// GET /api/experiments/[id]/my-application?privyDid=...
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: experimentId } = await params;
  const privyDid = request.nextUrl.searchParams.get('privyDid');
  if (!privyDid) {
    return NextResponse.json({ application: null });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('applications')
    .select('id, status, applied_at, payout_status')
    .eq('experiment_id', experimentId)
    .eq('participant_id', privyDid)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ application: null });
  }

  return NextResponse.json({ application: data });
}
