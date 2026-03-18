import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    experimentId?: string;
    authorId?: string;
    content?: string;
    parentId?: string | null;
  };

  const { experimentId, authorId, content, parentId = null } = body;

  if (!experimentId || !authorId || !content?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Verify author exists in profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', authorId)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Author profile not found' }, { status: 403 });
  }

  // If this is a reply (parentId set), verify parent exists and belongs to this experiment
  if (parentId) {
    const { data: parent } = await supabase
      .from('comments')
      .select('id')
      .eq('id', parentId)
      .eq('experiment_id', experimentId)
      .single();
    if (!parent) {
      return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
    }
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      experiment_id: experimentId,
      author_id:     authorId,
      content:       content.trim(),
      parent_id:     parentId ?? null,
      upvotes:       0,
    })
    .select('*, profiles!author_id(display_name, region, participant_profiles(participant_id, pseudonym))')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comment: data }, { status: 201 });
}
