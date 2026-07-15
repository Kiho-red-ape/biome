import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      name?: string; email?: string; website?: string;
      category?: string; description?: string; region?: string;
    };

    const { name, email, website, category, description, region } = body;

    if (!name?.trim() || !email?.trim() || !category?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { error: dbError } = await supabase.from('partner_applications').insert({
      name:        name.trim(),
      email:       email.trim(),
      website:     website?.trim() || null,
      category,
      description: description?.trim() || null,
      region:      region || null,
      logo_url:    null,
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
