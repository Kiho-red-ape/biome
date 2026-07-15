// GET  /api/study/[id]/consent-doc?privyDid=  → the study's current ICF (if any)
// POST /api/study/[id]/consent-doc  { privyDid, title, contentHtml }
//   Author/replace the study's Informed Consent Form. Stored as a participant-
//   clearance consent_form with content_html and status 'approved' so it powers
//   both the launch gate and the comprehension-gated consent flow.

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { canManageExperiment } from '@/lib/org/access';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: experimentId } = await params;
  const privyDid = req.nextUrl.searchParams.get('privyDid');
  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const db = createServiceClient();
  if (!(await canManageExperiment(db, privyDid, experimentId))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { data } = await db
    .from('study_documents')
    .select('id, title, content_html, version, status, updated_at')
    .eq('experiment_id', experimentId)
    .eq('document_type', 'consent_form')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ doc: data ?? null });
}

const schema = z.object({
  privyDid:    z.string().min(1),
  title:       z.string().min(2).max(200),
  contentHtml: z.string().min(40).max(100_000),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: experimentId } = await params;
  let body: z.infer<typeof schema>;
  try { body = schema.parse(await req.json()); }
  catch { return NextResponse.json({ error: 'title and consent text are required' }, { status: 400 }); }

  const db = createServiceClient();
  if (!(await canManageExperiment(db, body.privyDid, experimentId))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const hash = createHash('sha256').update(body.contentHtml).digest('hex');

  // Supersede any existing consent_form by bumping version.
  const { data: prev } = await db
    .from('study_documents')
    .select('id, version')
    .eq('experiment_id', experimentId)
    .eq('document_type', 'consent_form')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextVersion = ((prev as { version: number | null } | null)?.version ?? 0) + 1;

  const { data, error } = await db.from('study_documents').insert({
    experiment_id:   experimentId,
    document_type:   'consent_form',
    title:           body.title,
    clearance_level: 'participant',
    content_html:    body.contentHtml,
    content_hash:    hash,
    version:         nextVersion,
    supersedes_id:   (prev as { id: string } | null)?.id ?? null,
    requires_signature: true,
    status:          'approved',
    uploaded_by:     body.privyDid,
  }).select('id, version').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, doc: data });
}
