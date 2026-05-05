import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateSchema = z.object({
  privyDid:            z.string().min(1),
  title:               z.string().min(1).max(200).optional(),
  slug:                z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  hook:                z.string().optional(),
  content:             z.string().optional(),
  gatedArtifactUrl:    z.string().url().nullable().optional(),
  gatedArtifactLabel:  z.string().max(100).nullable().optional(),
  gatedArtifactType:   z.enum(['pdf', 'image']).nullable().optional(),
  tags:                z.string().array().optional(),
  status:              z.enum(['draft', 'published']).optional(),
});

type Props = { params: Promise<{ id: string }> };

// GET /api/blog/[id] — fetch single post (full content)
export async function GET(_req: NextRequest, { params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 });
  return NextResponse.json({ post: data });
}

// PATCH /api/blog/[id] — update post (author only)
export async function PATCH(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const body: unknown = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { privyDid, title, slug, hook, content, gatedArtifactUrl, gatedArtifactLabel, gatedArtifactType, tags, status } = parsed.data;

  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from('blog_posts')
    .select('id, author_id, status')
    .eq('id', id)
    .single();

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.author_id !== privyDid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (title               !== undefined) updates.title                = title;
  if (slug                !== undefined) updates.slug                 = slug;
  if (hook                !== undefined) updates.hook                 = hook;
  if (content             !== undefined) updates.content              = content;
  if (gatedArtifactUrl    !== undefined) updates.gated_artifact_url   = gatedArtifactUrl;
  if (gatedArtifactLabel  !== undefined) updates.gated_artifact_label = gatedArtifactLabel;
  if (gatedArtifactType   !== undefined) updates.gated_artifact_type  = gatedArtifactType;
  if (tags                !== undefined) updates.tags                 = tags;
  if (status              !== undefined) {
    updates.status = status;
    if (status === 'published' && existing.status === 'draft') {
      updates.published_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}

// DELETE /api/blog/[id] — delete post (author only)
export async function DELETE(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const privyDid = request.nextUrl.searchParams.get('privyDid');
  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from('blog_posts')
    .select('id, author_id')
    .eq('id', id)
    .single();

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.author_id !== privyDid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { error } = await supabase.from('blog_posts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
