import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest) {
  try {
    const { id, contacted, notes } = await req.json() as {
      id: string; contacted?: boolean; notes?: string;
    };
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const db = createServiceClient();
    const update: Record<string, unknown> = {};
    if (typeof contacted === 'boolean') {
      update.contacted    = contacted;
      update.contacted_at = contacted ? new Date().toISOString() : null;
    }
    if (typeof notes === 'string') update.notes = notes;

    await db.from('estimate_leads').update(update).eq('id', id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
