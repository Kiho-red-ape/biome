import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const { id, notes, ...fields } = body;

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const db = createServiceClient();

    // Fetch current log
    const { data: current } = await db
      .from('sample_kits')
      .select('chain_of_custody_log')
      .eq('id', id as string)
      .single();

    const log = (current?.chain_of_custody_log as unknown[]) ?? [];
    const newEntry = {
      timestamp: new Date().toISOString(),
      status:    JSON.stringify(fields),
      actor:     'operator',
      notes:     notes ?? null,
    };

    const patch: Record<string, unknown> = { ...fields };
    if (notes) patch.notes = notes;
    patch.chain_of_custody_log = [...log, newEntry];

    const { error } = await db.from('sample_kits').update(patch).eq('id', id as string);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('kits PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
