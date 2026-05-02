import { createServiceClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { BlogEditor } from '../../blog-editor';

interface Post {
  id: string; slug: string; title: string; excerpt: string | null;
  content: string; author: string; tags: string[]; status: string;
  published_at: string | null;
}

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createServiceClient();
  const { data } = await db.from('blog_posts').select('*').eq('id', id).single();
  if (!data) notFound();
  return <BlogEditor post={data as Post} />;
}
