import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// GET /api/notifications?privyDid=xxx&limit=20
// Returns recent notifications + unread count
export async function GET(req: NextRequest) {
  const privyDid = req.nextUrl.searchParams.get('privyDid');
  const limit    = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 20), 50);
  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, payload, read, created_at')
    .eq('user_id', privyDid)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows       = (data ?? []) as Array<Record<string, unknown>>;
  const unreadCount = rows.filter((n) => !n.read).length;

  return NextResponse.json({ notifications: rows, unreadCount });
}

// PATCH /api/notifications?privyDid=xxx
// Body: { ids?: string[] } — if omitted, marks all as read
export async function PATCH(req: NextRequest) {
  const privyDid = req.nextUrl.searchParams.get('privyDid');
  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const body = await req.json() as { ids?: string[] };
  const supabase = createServiceClient();

  let query = supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', privyDid);

  if (body.ids?.length) {
    query = query.in('id', body.ids);
  }

  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
