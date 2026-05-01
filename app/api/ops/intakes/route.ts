import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as { id: string; triage_status?: string; triage_notes?: string; triage_score?: number };
    const { id, ...patch } = body;

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const db = createServiceClient();
    const update: Record<string, unknown> = { ...patch };
    if (patch.triage_status) update.triaged_at = new Date().toISOString();

    const { error } = await db.from('client_intakes').update(update).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('intakes PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
