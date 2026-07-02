// GET /api/data-hub/upload-url?privyDid=&name=report.pdf
// Short-lived signed upload URL into the private `health-reports` bucket.
// Consent-gated. Client uploads directly, then registers via POST /api/data-hub.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { CONSENT_VERSION } from '@/lib/data-hub/consents';

const BUCKET = 'health-reports';
const ALLOWED_EXT = ['pdf', 'jpg', 'jpeg', 'png'];

export async function GET(req: NextRequest) {
  const privyDid = req.nextUrl.searchParams.get('privyDid');
  const fileName = req.nextUrl.searchParams.get('name');
  if (!privyDid || !fileName) {
    return NextResponse.json({ error: 'privyDid and name required' }, { status: 400 });
  }

  const db = createServiceClient();

  // Consent gate.
  const { data: consent } = await db
    .from('data_consents')
    .select('granted, withdrawn_at')
    .eq('participant_id', privyDid)
    .eq('scope', 'health_reports')
    .eq('consent_version', CONSENT_VERSION)
    .maybeSingle();
  const c = consent as { granted: boolean; withdrawn_at: string | null } | null;
  if (!c || !c.granted || c.withdrawn_at) {
    return NextResponse.json({ error: 'Consent required before uploading reports' }, { status: 403 });
  }

  const ext = (fileName.split('.').pop() ?? '').toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    return NextResponse.json({ error: 'Only PDF, JPG, or PNG files are accepted' }, { status: 400 });
  }

  const filePath = `${privyDid}/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(filePath, { upsert: false });
  if (error || !data) {
    console.error('[data-hub/upload-url]', error);
    return NextResponse.json({ error: 'Could not generate upload URL' }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl, filePath, token: data.token });
}
