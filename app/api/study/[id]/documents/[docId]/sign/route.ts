// POST /api/study/[id]/documents/[docId]/sign
// Captures a digital signature on a document.
// The signer confirms they have read and agree to be bound by the document.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getUserClearance, canAccessDocument } from '@/lib/documents/access';
import type { ClearanceLevel } from '@/lib/documents/types';

type Ctx = { params: Promise<{ id: string; docId: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: experimentId, docId } = await params;
  const privyDid = req.headers.get('x-privy-did');
  if (!privyDid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    signer_name:  string;
    signer_email?: string;
    signer_role:  'researcher' | 'sponsor' | 'participant' | 'operator' | 'witness';
  };

  if (!body.signer_name?.trim() || !body.signer_role) {
    return NextResponse.json({ error: 'signer_name and signer_role required' }, { status: 400 });
  }

  const clearance = await getUserClearance(privyDid, experimentId);
  const supabase  = createServiceClient();

  const { data: doc } = await supabase
    .from('study_documents')
    .select('id, status, requires_signature, version, clearance_level, content_hash, file_path')
    .eq('id', docId)
    .single();

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!canAccessDocument(clearance, doc.clearance_level as ClearanceLevel)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!doc.requires_signature) {
    return NextResponse.json({ error: 'Document does not require a signature' }, { status: 400 });
  }
  if (doc.status === 'signed' || doc.status === 'approved') {
    return NextResponse.json({ error: 'Document already signed' }, { status: 409 });
  }

  const ip         = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null;
  const user_agent = req.headers.get('user-agent') ?? null;

  const { error: sigError } = await supabase.from('document_signatures').insert({
    document_id:      docId,
    signer_user_id:   privyDid,
    signer_name:      body.signer_name.trim(),
    signer_email:     body.signer_email ?? null,
    signer_role:      body.signer_role,
    ip_address:       ip,
    user_agent,
    document_version: doc.version,
    document_hash:    doc.content_hash,
  });

  if (sigError) {
    if (sigError.code === '23505') {
      return NextResponse.json({ error: 'Already signed by this user' }, { status: 409 });
    }
    return NextResponse.json({ error: sigError.message }, { status: 500 });
  }

  // Update document status to 'signed'
  await supabase
    .from('study_documents')
    .update({ status: 'signed' })
    .eq('id', docId);

  // Log the signing in send_log if there was a pending send
  await supabase
    .from('document_send_log')
    .update({ signed_at: new Date().toISOString() })
    .eq('document_id', docId)
    .is('signed_at', null);

  return NextResponse.json({ ok: true, signed_at: new Date().toISOString() });
}
