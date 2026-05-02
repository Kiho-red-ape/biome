import { createServiceClient } from '@/lib/supabase/server';
import Link from 'next/link';

interface Post {
  id: string; slug: string; title: string; status: string;
  published_at: string | null; created_at: string; author: string; tags: string[];
}

export default async function OpsBlogPage() {
  const db = createServiceClient();
  const { data } = await db
    .from('blog_posts')
    .select('id, slug, title, status, published_at, created_at, author, tags')
    .order('created_at', { ascending: false });

  const posts = (data ?? []) as Post[];
  const STATUS_COLOR: Record<string, string> = {
    published: '#b7ff61',
    draft:     '#ffb300',
    archived:  '#5b8a9a',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px', color: '#ffb300', textTransform: 'uppercase' }}>
          // BLOG_CMS
        </p>
        <Link
          href="/ops/blog/new"
          style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      10,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color:         '#ffb300',
            border:        '1px solid rgba(255,179,0,0.3)',
            padding:       '6px 16px',
            borderRadius:  2,
            textDecoration: 'none',
          }}
        >
          + New post
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {posts.length === 0 && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5b8a9a' }}>No posts yet.</p>
        )}
        {posts.map(post => (
          <div key={post.id} style={{
            background:     '#0b1014',
            border:         '1px solid rgba(255,255,255,0.05)',
            borderRadius:   2,
            padding:        '14px 20px',
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'center',
            flexWrap:       'wrap',
            gap:            8,
          }}>
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#f2faf4', marginBottom: 2 }}>
                {post.title}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5b8a9a' }}>
                /{post.slug} · {post.author} · {new Date(post.created_at).toLocaleDateString()}
                {post.tags.length > 0 && ` · ${post.tags.join(', ')}`}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      9,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color:         STATUS_COLOR[post.status] ?? '#5b8a9a',
                border:        `1px solid ${STATUS_COLOR[post.status] ?? '#5b8a9a'}`,
                padding:       '2px 8px',
                borderRadius:  2,
                opacity:       0.8,
              }}>
                {post.status}
              </span>
              <Link
                href={`/ops/blog/${post.id}/edit`}
                style={{
                  fontFamily:    'var(--font-mono)',
                  fontSize:      10,
                  color:         '#ffb300',
                  textDecoration: 'none',
                  letterSpacing: '0.5px',
                }}
              >
                Edit →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
