// GET /api/dashboard/documents?privyDid=did:privy:xxx
// Lists the participant-visible documents across all of a participant's enrolled
// studies, grouped by study. Mirrors the participant clearance rule in
// lib/documents/access.ts (enrolled = application status approved|active|completed).
// Signed download URLs are NOT generated here — the client fetches them lazily
// via the existing /api/study/[id]/documents/[docId] route on demand.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { DocumentStudyGroup, ParticipantDoc } from '@/lib/dashboard/tasks';

const ENROLLED = ['approved', 'active', 'completed'];

export async function GET(request: NextRequest) {
  const privyDid = request.nextUrl.searchParams.get('privyDid');
  if (!privyDid) {
    return NextResponse.json({ error: 'privyDid required' }, { status: 400 });
  }

  const db = createServiceClient();

  // Enrolled studies (+ titles).
  type AppRow = { experiment_id: string; experiments: { id: string; title: string } | null };
  const { data: appsRaw, error: appsErr } = await db
    .from('applications')
    .select('experiment_id, experiments(id, title)')
    .eq('participant_id', privyDid)
    .in('status', ENROLLED);

  if (appsErr) return NextResponse.json({ error: appsErr.message }, { status: 500 });

  const apps = (appsRaw ?? []) as unknown as AppRow[];
  if (apps.length === 0) return NextResponse.json({ studies: [] });

  const titleByExp = new Map<string, string>();
  for (const a of apps) if (a.experiments) titleByExp.set(a.experiments.id, a.experiments.title);
  const expIds = [...titleByExp.keys()];

  // Participant-clearance, shareable documents for those studies.
  type DocRow = {
    id: string; experiment_id: string; title: string; document_type: string;
    requires_signature: boolean; signature_due_date: string | null; file_name: string | null;
    document_signatures: { signer_user_id: string }[] | null;
  };
  const { data: docsRaw, error: docsErr } = await db
    .from('study_documents')
    .select('id, experiment_id, title, document_type, requires_signature, ' +
            'signature_due_date, file_name, document_signatures(signer_user_id)')
    .in('experiment_id', expIds)
    .eq('clearance_level', 'participant')
    .in('status', ['approved', 'signed', 'pending_signature'])
    .order('created_at', { ascending: false });

  if (docsErr) return NextResponse.json({ error: docsErr.message }, { status: 500 });

  const docs = (docsRaw ?? []) as unknown as DocRow[];

  // Group by study.
  const byStudy = new Map<string, ParticipantDoc[]>();
  for (const d of docs) {
    const doc: ParticipantDoc = {
      id:                d.id,
      experimentId:      d.experiment_id,
      title:             d.title,
      documentType:      d.document_type,
      requiresSignature: d.requires_signature,
      signedByMe:        (d.document_signatures ?? []).some((s) => s.signer_user_id === privyDid),
      signatureDueDate:  d.signature_due_date,
      fileName:          d.file_name,
    };
    if (!byStudy.has(d.experiment_id)) byStudy.set(d.experiment_id, []);
    byStudy.get(d.experiment_id)!.push(doc);
  }

  const studies: DocumentStudyGroup[] = [...byStudy.entries()].map(([studyId, documents]) => ({
    studyId,
    studyTitle: titleByExp.get(studyId) ?? 'Study',
    documents,
  }));

  return NextResponse.json({ studies });
}
