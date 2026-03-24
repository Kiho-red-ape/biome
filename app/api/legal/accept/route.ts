// PATCH /api/legal/accept — record legal document acceptance
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';

const Schema = z.object({
  privy_did: z.string().min(1),
  doc_key: z.enum(['tos', 'participant_agreement', 'experimenter_agreement']),
});

const DOC_COLUMN: Record<string, string> = {
  tos:                    'tos_accepted_at',
  participant_agreement:  'study_agreement_accepted_at',
  experimenter_agreement: 'experimenter_agreement_accepted_at',
};

export async function PATCH(req: NextRequest) {
  const body   = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { privy_did, doc_key } = parsed.data;
  const col = DOC_COLUMN[doc_key];
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('profiles')
    .update({ [col]: new Date().toISOString() })
    .eq('id', privy_did);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, doc_key, accepted_at: new Date().toISOString() });
}
