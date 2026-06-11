// GET    /api/study/[id]/documents/[docId]  → document + signed download URL
// PATCH  /api/study/[id]/documents/[docId]  → update status/notes (ops only)
// DELETE /api/study/[id]/documents/[docId]  → soft-delete only for ops

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getUserClearance, canAccessDocument } from '@/lib/documents/access';
import type { ClearanceLevel } from '@/lib/documents/types';

const BUCKET   = 'study-documents';
const URL_TTL  = 3600; // 1 hour signed URL

type Ctx = { params: Promise<{ id: string; docId: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id: experimentId, docId } = await params;
  const privyDid = req.headers.get('x-privy-did');
  if (!privyDid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clearance = await getUserClearance(privyDid, experimentId);
  const supabase  = createServiceClient();

  const { data: doc, error } = await supabase
    .from('study_documents')
    .select('*, signatures:document_signatures(*), send_log:document_send_log(*)')
    .eq('id', docId)
    .eq('experiment_id', experimentId)
    .single();

  if (error || !doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (!canAccessDocument(clearance, doc.clearance_level as ClearanceLevel)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Generate signed download URL if there's a file
  let downloadUrl: string | null = null;
  if (doc.file_path) {
    const { data: urlData } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(doc.file_path, URL_TTL);
    downloadUrl = urlData?.signedUrl ?? null;
  }

  return NextResponse.json({ document: doc, downloadUrl });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id: experimentId, docId } = await params;
  const privyDid = req.headers.get('x-privy-did');
  if (!privyDid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clearance = await getUserClearance(privyDid, experimentId);
  const supabase  = createServiceClient();

  const { data: doc } = await supabase
    .from('study_documents')
    .select('id, status, uploaded_by, clearance_level')
    .eq('id', docId)
    .single();

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json() as Record<string, unknown>;

  // Researcher can only: submit for review (draft → pending_review), add description
  // Operator can: change status, add review notes, change clearance, set requires_signature
  const isOps = clearance === 'operator';
  const isOwner = clearance === 'researcher' && doc.uploaded_by === privyDid;

  if (!isOps && !isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const patch: Record<string, unknown> = {};

  if (isOwner && !isOps) {
    // Researchers can only submit for review or update their own description/title
    if (body.status === 'pending_review' && doc.status === 'draft') {
      patch.status = 'pending_review';
    }
    if (body.description !== undefined) patch.description = body.description;
    if (body.title !== undefined)       patch.title       = body.title;
  }

  if (isOps) {
    // Ops can set anything
    const allowed = ['status','review_notes','clearance_level','requires_signature',
                     'signature_due_date','expires_at','description','title'];
    for (const key of allowed) {
      if (body[key] !== undefined) patch[key] = body[key];
    }
    if (body.status === 'approved') {
      patch.approved_by = privyDid;
      patch.approved_at = new Date().toISOString();
    }
    if (body.status === 'pending_signature') {
      patch.requires_signature = true;
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from('study_documents')
    .update(patch)
    .eq('id', docId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ document: updated });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id: experimentId, docId } = await params;
  const privyDid = req.headers.get('x-privy-did');
  if (!privyDid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clearance = await getUserClearance(privyDid, experimentId);
  // Only operator or the uploader (if still draft) can delete
  const supabase = createServiceClient();

  const { data: doc } = await supabase
    .from('study_documents')
    .select('id, status, uploaded_by, file_path')
    .eq('id', docId)
    .single();

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const isOps   = clearance === 'operator';
  const isDraft = doc.status === 'draft' && doc.uploaded_by === privyDid;

  if (!isOps && !isDraft) {
    return NextResponse.json({ error: 'Cannot delete a submitted document' }, { status: 403 });
  }

  // Delete file from Storage if present
  if (doc.file_path) {
    await supabase.storage.from(BUCKET).remove([doc.file_path]);
  }

  await supabase.from('study_documents').delete().eq('id', docId);

  return NextResponse.json({ ok: true });
}
