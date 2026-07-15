// GET  /api/study/[id]/documents/upload-url
// Returns a short-lived Supabase Storage signed upload URL.
// Client uploads directly to Storage, then POSTs metadata to /documents.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getUserClearance } from '@/lib/documents/access';
import { UPLOADER_ROLE } from '@/lib/documents/types';
import type { DocumentType } from '@/lib/documents/types';

const BUCKET = 'study-documents';
const EXPIRES = 300; // 5 minutes

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: experimentId } = await params;
  const privyDid   = req.headers.get('x-privy-did');
  const docType    = req.nextUrl.searchParams.get('type') as DocumentType | null;
  const fileName   = req.nextUrl.searchParams.get('name');

  if (!privyDid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!docType || !fileName) return NextResponse.json({ error: 'type and name required' }, { status: 400 });

  const clearance = await getUserClearance(privyDid, experimentId);
  const uploaderRole = UPLOADER_ROLE[docType] ?? 'both';

  if (clearance === 'none' || clearance === 'participant') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (clearance === 'researcher' && uploaderRole === 'operator') {
    return NextResponse.json({ error: 'This document type is uploaded by Biome ops' }, { status: 403 });
  }

  const ext      = fileName.split('.').pop() ?? 'pdf';
  const filePath = `${experimentId}/${docType}/${crypto.randomUUID()}.${ext}`;

  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(filePath, { upsert: false });

  if (error || !data) {
    console.error('[upload-url]', error);
    return NextResponse.json({ error: 'Could not generate upload URL' }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl, filePath, token: data.token });
}
