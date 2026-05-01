import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as { id: string; status?: string; display_on_homepage?: boolean };
    const { id, ...patch } = body;

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const db = createServiceClient();
    const update: Record<string, unknown> = { ...patch };
    if (patch.status === 'approved') update.approved_at = new Date().toISOString();

    const { error } = await db.from('partner_applications').update(update).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('partners PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
