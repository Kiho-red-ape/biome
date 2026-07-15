// GET  /api/study/[id]/documents  → list all documents visible to caller
// POST /api/study/[id]/documents  → create document record (after file upload)

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getUserClearance, canAccessDocument, canUpload } from '@/lib/documents/access';
import { UPLOADER_ROLE } from '@/lib/documents/types';
import type { DocumentType, ClearanceLevel } from '@/lib/documents/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: experimentId } = await params;
  const privyDid = req.headers.get('x-privy-did');
  if (!privyDid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clearance = await getUserClearance(privyDid, experimentId);
  const supabase  = createServiceClient();

  const { data, error } = await supabase
    .from('study_documents')
    .select('*, signatures:document_signatures(*)')
    .eq('experiment_id', experimentId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const visible = (data ?? []).filter(d =>
    canAccessDocument(clearance, d.clearance_level as ClearanceLevel),
  );

  return NextResponse.json({ documents: visible, clearance });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: experimentId } = await params;
  const privyDid = req.headers.get('x-privy-did');
  if (!privyDid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clearance = await getUserClearance(privyDid, experimentId);
  if (clearance === 'none' || clearance === 'participant') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json() as Record<string, unknown>;
  const {
    document_type, title, description, clearance_level,
    file_path, file_name, file_size_bytes, mime_type,
    requires_signature, signature_due_date, content_html,
  } = body;

  if (!document_type || !title) {
    return NextResponse.json({ error: 'document_type and title required' }, { status: 400 });
  }

  const uploaderRole = UPLOADER_ROLE[document_type as DocumentType] ?? 'both';
  if (!canUpload(clearance, uploaderRole)) {
    return NextResponse.json({ error: 'This document type is uploaded by Biome ops' }, { status: 403 });
  }

  // Default clearance level by document type
  const defaultClearance: Record<DocumentType, ClearanceLevel> = {
    irb_approval:           'researcher',
    study_protocol:         'researcher',
    amendment:              'researcher',
    participant_info_sheet: 'participant',
    consent_form:           'participant',
    service_contract:       'operator',
    researcher_agreement:   'researcher',
    sponsor_authorization:  'researcher',
    data_sharing_agreement: 'researcher',
    insurance_certificate:  'researcher',
    regulatory_filing:      'researcher',
    lab_agreement:          'operator',
    pi_credentials:         'operator',
    other:                  'researcher',
  };

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('study_documents')
    .insert({
      experiment_id:      experimentId,
      document_type:      String(document_type),
      title:              String(title),
      description:        description ? String(description) : null,
      clearance_level:    clearance_level
                            ? String(clearance_level)
                            : defaultClearance[document_type as DocumentType] ?? 'researcher',
      file_path:          file_path    ? String(file_path)    : null,
      file_name:          file_name    ? String(file_name)    : null,
      file_size_bytes:    file_size_bytes ? Number(file_size_bytes) : null,
      mime_type:          mime_type    ? String(mime_type)    : null,
      requires_signature: Boolean(requires_signature),
      signature_due_date: signature_due_date ? String(signature_due_date) : null,
      content_html:       content_html ? String(content_html) : null,
      uploaded_by:        privyDid,
      status:             'draft',
    })
    .select()
    .single();

  if (error) {
    console.error('[documents POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ document: data }, { status: 201 });
}
