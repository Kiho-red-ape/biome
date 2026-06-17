import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export type SessionMessage = {
  role: string;
  content: string;
  cost_usd: number;
};

export async function GET(req: NextRequest) {
  const privyDid = req.headers.get('x-privy-did');
  if (!privyDid) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const sessionId = req.nextUrl.searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

  const supabase = createServiceClient();

  // Verify session belongs to this user
  const { data: session } = await supabase
    .from('ome_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', privyDid)
    .single();

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const { data: messages, error } = await supabase
    .from('ome_messages')
    .select('role, content, cost_usd')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: (messages ?? []) as SessionMessage[] });
}
