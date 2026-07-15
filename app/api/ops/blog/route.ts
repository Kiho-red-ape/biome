import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const db = createServiceClient();
    const { data, error } = await db.from('blog_posts').insert(body).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, id: (data as Record<string, unknown>).id });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const db = createServiceClient();
    const update = { ...rest, updated_at: new Date().toISOString() };
    const { error } = await db.from('blog_posts').update(update).eq('id', id as string);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json() as { id: string };
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const db = createServiceClient();
    // Only allow deletion of drafts
    const { data: post } = await db.from('blog_posts').select('status').eq('id', id).single();
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    if (post.status === 'published') {
      return NextResponse.json({ error: 'Cannot delete a published post. Archive it first.' }, { status: 400 });
    }
    const { error } = await db.from('blog_posts').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

