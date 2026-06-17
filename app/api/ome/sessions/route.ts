// GET /api/ome/sessions — list OME sessions for the authenticated researcher
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const privyDid = req.headers.get('x-privy-did');
  if (!privyDid) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('ome_sessions')
    .select('id, title, total_tokens, total_cost_usd, created_at, updated_at')
    .eq('user_id', privyDid)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ sessions: data ?? [] });
}
