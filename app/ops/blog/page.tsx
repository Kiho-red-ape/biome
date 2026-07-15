import { createServiceClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { OpsPageHeader, OpsCard, OpsBadge, OpsButton } from '../_components/ui';

interface Post {
  id: string; slug: string; title: string; status: string;
  published_at: string | null; created_at: string; author: string; tags: string[];
}

type PostTone = 'teal' | 'green' | 'amber' | 'red' | 'slate' | 'blue';

function postStatusTone(status: string): PostTone {
  if (status === 'published') return 'green';
  if (status === 'draft')     return 'amber';
  if (status === 'archived')  return 'slate';
  return 'slate';
}

export default async function OpsBlogPage() {
  const db = createServiceClient();
  const { data } = await db
    .from('blog_posts')
    .select('id, slug, title, status, published_at, created_at, author, tags')
    .order('created_at', { ascending: false });

  const posts = (data ?? []) as Post[];

  return (
    <div>
      <OpsPageHeader
        label="Blog"
        title="Blog CMS"
        subtitle={`${posts.length} post${posts.length === 1 ? '' : 's'}`}
        actions={<OpsButton href="/ops/blog/new" variant="primary">+ New post</OpsButton>}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {posts.length === 0 && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)' }}>No posts yet.</p>
        )}
        {posts.map(post => (
          <OpsCard key={post.id} style={{ padding: '14px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--ink)', marginBottom: 4 }}>
                  {post.title}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                  /{post.slug} · {post.author} · {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {post.tags.length > 0 && ` · ${post.tags.join(', ')}`}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <OpsBadge tone={postStatusTone(post.status)}>{post.status}</OpsBadge>
                <Link
                  href={`/ops/blog/${post.id}/edit`}
                  style={{
                    fontFamily:    'var(--font-mono)',
                    fontSize:      11,
                    color:         'var(--teal-dark)',
                    textDecoration: 'none',
                    letterSpacing: '0.5px',
                  }}
                >
                  Edit →
                </Link>
              </div>
            </div>
          </OpsCard>
        ))}
      </div>
    </div>
  );
}
