import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg':      'jpg',
  'image/jpg':       'jpg',
  'image/png':       'png',
};

// POST /api/blog/upload — upload artifact file to Supabase Storage
// Body: multipart/form-data with `file` and `privyDid` fields
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file     = formData.get('file') as File | null;
  const privyDid = formData.get('privyDid') as string | null;

  if (!file)     return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: 'File type not supported. Upload a PDF, JPEG, or PNG.' },
      { status: 400 }
    );
  }

  // 10 MB limit
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 });
  }

  const bytes    = await file.arrayBuffer();
  const buffer   = Buffer.from(bytes);
  const fileName = `${privyDid.replace(/[^a-z0-9]/gi, '_')}/${Date.now()}.${ext}`;

  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from('blog-artifacts')
    .upload(fileName, buffer, { contentType: file.type, upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: urlData } = supabase.storage
    .from('blog-artifacts')
    .getPublicUrl(data.path);

  return NextResponse.json({
    url:  urlData.publicUrl,
    type: file.type === 'application/pdf' ? 'pdf' : 'image',
  });
}
