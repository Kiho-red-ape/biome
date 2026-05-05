import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createSchema = z.object({
  authorId:            z.string().min(1),
  title:               z.string().min(1).max(200),
  slug:                z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, hyphens only'),
  hook:                z.string().default(''),
  content:             z.string().default(''),
  gatedArtifactUrl:    z.string().url().nullable().optional(),
  gatedArtifactLabel:  z.string().max(100).nullable().optional(),
  gatedArtifactType:   z.enum(['pdf', 'image']).nullable().optional(),
  tags:                z.string().array().optional(),
  status:              z.enum(['draft', 'published']).default('draft'),
});

// GET /api/blog?privyDid=xxx  → own posts (drafts + published)
// GET /api/blog               → published only
export async function GET(request: NextRequest) {
  const privyDid = request.nextUrl.searchParams.get('privyDid');
  const supabase = createServiceClient();

  let query = supabase
    .from('blog_posts')
    .select('id, title, slug, hook, status, tags, published_at, created_at, updated_at, author_id, gated_artifact_label, gated_artifact_type')
    .order('created_at', { ascending: false });

  if (privyDid) {
    query = query.eq('author_id', privyDid);
  } else {
    query = query.eq('status', 'published');
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data });
}

// POST /api/blog — create post
export async function POST(request: NextRequest) {
  const body: unknown = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const {
    authorId, title, slug, hook, content,
    gatedArtifactUrl, gatedArtifactLabel, gatedArtifactType,
    tags, status,
  } = parsed.data;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      author_id:            authorId,
      title,
      slug,
      hook,
      content,
      gated_artifact_url:   gatedArtifactUrl   ?? null,
      gated_artifact_label: gatedArtifactLabel ?? null,
      gated_artifact_type:  gatedArtifactType  ?? null,
      tags:                 tags ?? [],
      status,
      published_at: status === 'published' ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data }, { status: 201 });
}
