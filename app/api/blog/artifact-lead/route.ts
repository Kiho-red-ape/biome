import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  postId: z.string().uuid(),
  email:  z.string().email(),
});

// POST /api/blog/artifact-lead — capture email, return artifact URL
export async function POST(request: NextRequest) {
  const body: unknown = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { postId, email } = parsed.data;
  const supabase = createServiceClient();

  // Verify the post exists and is published, get artifact URL
  const { data: post, error: postErr } = await supabase
    .from('blog_posts')
    .select('id, gated_artifact_url, gated_artifact_label, status')
    .eq('id', postId)
    .eq('status', 'published')
    .single();

  if (postErr || !post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  if (!post.gated_artifact_url) return NextResponse.json({ error: 'No artifact on this post' }, { status: 404 });

  // Store the lead (upsert by post+email to avoid duplicate rows)
  await supabase
    .from('blog_artifact_leads')
    .upsert({ post_id: postId, email }, { onConflict: 'post_id,email', ignoreDuplicates: true });

  return NextResponse.json({
    url:   post.gated_artifact_url,
    label: post.gated_artifact_label ?? 'Download',
  });
}
