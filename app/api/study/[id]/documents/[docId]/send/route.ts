// POST /api/study/[id]/documents/[docId]/send
// Sends a signature request notification to a counterparty.
// Operator only — used to send contracts to researchers/sponsors.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getUserClearance } from '@/lib/documents/access';
import { DOC_TYPE_LABEL } from '@/lib/documents/types';
import type { DocumentType } from '@/lib/documents/types';

type Ctx = { params: Promise<{ id: string; docId: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: experimentId, docId } = await params;
  const privyDid = req.headers.get('x-privy-did');
  if (!privyDid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clearance = await getUserClearance(privyDid, experimentId);
  if (clearance === 'none' || clearance === 'participant') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json() as {
    to_email:  string;
    to_user_id?: string;
    message?:  string;
  };

  if (!body.to_email) return NextResponse.json({ error: 'to_email required' }, { status: 400 });

  const supabase = createServiceClient();

  const { data: doc } = await supabase
    .from('study_documents')
    .select('id, title, document_type, status, experiment_id')
    .eq('id', docId)
    .single();

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Mark document as pending_signature
  await supabase
    .from('study_documents')
    .update({ status: 'pending_signature', requires_signature: true })
    .eq('id', docId);

  // Log the send action
  const { error: logError } = await supabase.from('document_send_log').insert({
    document_id:    docId,
    sent_to_email:  body.to_email,
    sent_to_user_id: body.to_user_id ?? null,
    sent_by:        privyDid,
    message:        body.message ?? null,
  });

  if (logError) {
    console.error('[send-log]', logError);
  }

  // Send email via internal notification (leverages existing email infra)
  // In production this would trigger a transactional email via Resend/Postmark
  const typeLabel = DOC_TYPE_LABEL[doc.document_type as DocumentType] ?? doc.document_type;
  const dashUrl   = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/experiments/${experimentId}?tab=documents`;

  console.log(`[documents/send] Signature request sent:
  To:       ${body.to_email}
  Document: ${doc.title} (${typeLabel})
  Sign at:  ${dashUrl}
  Message:  ${body.message ?? '(none)'}`);

  // TODO: Wire to Resend/Postmark for production email delivery
  // await sendEmail({
  //   to: body.to_email,
  //   subject: `Action required: Please sign "${doc.title}"`,
  //   body: `...`
  // })

  return NextResponse.json({ ok: true, sent_to: body.to_email });
}
