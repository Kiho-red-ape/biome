import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const name        = formData.get('name') as string | null;
    const email       = formData.get('email') as string | null;
    const website     = formData.get('website') as string | null;
    const category    = formData.get('category') as string | null;
    const description = formData.get('description') as string | null;
    const region      = formData.get('region') as string | null;
    const logo        = formData.get('logo') as File | null;

    if (!name || !email || !category || !logo) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (logo.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Logo must be under 2MB' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Upload logo to Supabase Storage
    const ext      = logo.name.split('.').pop() ?? 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('partner-logos')
      .upload(fileName, logo, { contentType: logo.type, upsert: false });

    if (uploadError) {
      console.error('logo upload error:', uploadError);
      return NextResponse.json({ error: 'Logo upload failed' }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from('partner-logos')
      .getPublicUrl(fileName);

    const { error: dbError } = await supabase.from('partner_applications').insert({
      name,
      email,
      website:     website || null,
      category,
      description: description || null,
      region:      region || null,
      logo_url:    urlData.publicUrl,
      status:      'pending',
    });

    if (dbError) {
      console.error('partner insert error:', dbError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('partners apply route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
