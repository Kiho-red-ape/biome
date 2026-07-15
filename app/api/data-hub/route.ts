// The participant data hub — ongoing, consent-gated data contribution.
//
// GET  ?privyDid=  → consent states + longitudinal snapshots + reports
// POST { action } :
//   'grant_consent' | 'withdraw_consent'  { scope }
//   'sync_metadata'                        { source, metrics }   (consent-gated)
//   'register_report'                      { title, reportType, reportDate?, filePath?, fileName?, mimeType?, fileSizeBytes?, notes? }
//   'delete_report'                        { reportId }           (right-to-delete)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import {
  CONSENT_SCOPES, CONSENT_TEXTS, CONSENT_VERSION, consentHash, type ConsentScope,
} from '@/lib/data-hub/consents';

type Db = ReturnType<typeof createServiceClient>;

async function activeConsent(db: Db, participantId: string, scope: ConsentScope): Promise<boolean> {
  const { data } = await db
    .from('data_consents')
    .select('granted, withdrawn_at')
    .eq('participant_id', participantId)
    .eq('scope', scope)
    .eq('consent_version', CONSENT_VERSION)
    .maybeSingle();
  const row = data as { granted: boolean; withdrawn_at: string | null } | null;
  return !!row && row.granted && !row.withdrawn_at;
}

export async function GET(req: NextRequest) {
  const privyDid = req.nextUrl.searchParams.get('privyDid');
  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const db = createServiceClient();
  const [{ data: consents }, { data: snapshots }, { data: reports }] = await Promise.all([
    db.from('data_consents')
      .select('scope, granted, withdrawn_at, consent_version, granted_at')
      .eq('participant_id', privyDid)
      .eq('consent_version', CONSENT_VERSION),
    db.from('health_data_snapshots')
      .select('id, source, captured_at, metrics')
      .eq('participant_id', privyDid)
      .order('captured_at', { ascending: false })
      .limit(60),
    db.from('health_reports')
      .select('id, title, report_type, report_date, file_name, notes, created_at')
      .eq('participant_id', privyDid)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ]);

  const consentRows = (consents ?? []) as Array<{ scope: string; granted: boolean; withdrawn_at: string | null }>;
  const consentState = Object.fromEntries(CONSENT_SCOPES.map((s) => {
    const row = consentRows.find((c) => c.scope === s);
    return [s, !!row && row.granted && !row.withdrawn_at];
  }));

  return NextResponse.json({
    consentVersion: CONSENT_VERSION,
    consentTexts:   CONSENT_TEXTS,
    consents:       consentState,
    snapshots:      snapshots ?? [],
    reports:        reports ?? [],
  });
}

const metricsSchema = z.record(z.string(), z.union([z.number(), z.string()])).refine(
  (m) => Object.keys(m).length > 0 && Object.keys(m).length <= 20,
  'Between 1 and 20 metrics per sync',
);

const postSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('grant_consent'),    privyDid: z.string().min(1), scope: z.enum(['metadata_sync', 'health_reports', 'digital_twin_research']) }),
  z.object({ action: z.literal('withdraw_consent'), privyDid: z.string().min(1), scope: z.enum(['metadata_sync', 'health_reports', 'digital_twin_research']) }),
  z.object({
    action: z.literal('sync_metadata'), privyDid: z.string().min(1),
    source: z.enum(['manual', 'apple_health', 'google_fit', 'fitbit', 'garmin', 'whoop', 'oura', 'other']).default('manual'),
    metrics: metricsSchema,
  }),
  z.object({
    action: z.literal('register_report'), privyDid: z.string().min(1),
    title: z.string().min(2).max(160),
    reportType: z.enum(['lab_panel', 'imaging', 'genetic', 'prescription', 'discharge_summary', 'vaccination', 'other']).default('other'),
    reportDate: z.string().nullable().optional(),
    filePath: z.string().max(500).nullable().optional(),
    fileName: z.string().max(200).nullable().optional(),
    mimeType: z.string().max(100).nullable().optional(),
    fileSizeBytes: z.number().int().positive().nullable().optional(),
    notes: z.string().max(1000).nullable().optional(),
  }),
  z.object({ action: z.literal('delete_report'), privyDid: z.string().min(1), reportId: z.string().uuid() }),
]);

export async function POST(req: NextRequest) {
  let body: z.infer<typeof postSchema>;
  try { body = postSchema.parse(await req.json()); }
  catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }

  const db = createServiceClient();
  const { privyDid } = body;

  // Participant must exist.
  const { data: prof } = await db
    .from('participant_profiles').select('user_id').eq('user_id', privyDid).maybeSingle();
  if (!prof) return NextResponse.json({ error: 'Participant profile required' }, { status: 403 });

  switch (body.action) {
    case 'grant_consent': {
      const { error } = await db.from('data_consents').upsert({
        participant_id: privyDid, scope: body.scope, granted: true,
        consent_version: CONSENT_VERSION, consent_text_hash: consentHash(body.scope),
        granted_at: new Date().toISOString(), withdrawn_at: null,
      }, { onConflict: 'participant_id,scope,consent_version' });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, granted: true });
    }

    case 'withdraw_consent': {
      const { error } = await db.from('data_consents')
        .update({ granted: false, withdrawn_at: new Date().toISOString() })
        .eq('participant_id', privyDid).eq('scope', body.scope).eq('consent_version', CONSENT_VERSION);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, granted: false });
    }

    case 'sync_metadata': {
      if (!(await activeConsent(db, privyDid, 'metadata_sync'))) {
        return NextResponse.json({ error: 'Consent required before syncing data' }, { status: 403 });
      }
      const { error } = await db.from('health_data_snapshots').insert({
        participant_id: privyDid, source: body.source, metrics: body.metrics,
        captured_at: new Date().toISOString(),
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    case 'register_report': {
      if (!(await activeConsent(db, privyDid, 'health_reports'))) {
        return NextResponse.json({ error: 'Consent required before uploading reports' }, { status: 403 });
      }
      const { data, error } = await db.from('health_reports').insert({
        participant_id: privyDid, title: body.title, report_type: body.reportType,
        report_date: body.reportDate ?? null, file_path: body.filePath ?? null,
        file_name: body.fileName ?? null, mime_type: body.mimeType ?? null,
        file_size_bytes: body.fileSizeBytes ?? null, notes: body.notes ?? null,
      }).select('id').single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, reportId: (data as { id: string }).id });
    }

    case 'delete_report': {
      // Right-to-delete: soft-delete the row and remove the stored file.
      const { data: rep } = await db.from('health_reports')
        .select('id, file_path').eq('id', body.reportId).eq('participant_id', privyDid).maybeSingle();
      if (!rep) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      await db.from('health_reports')
        .update({ deleted_at: new Date().toISOString() }).eq('id', body.reportId);
      const path = (rep as { file_path: string | null }).file_path;
      if (path) await db.storage.from('health-reports').remove([path]).catch(() => undefined);
      return NextResponse.json({ ok: true });
    }
  }
}
