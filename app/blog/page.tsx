import { createAnonClient } from '@/lib/supabase/anon';
import { SiteHeader } from '@/components/nav/header';
import Link from 'next/link';

interface Post {
  id: string; slug: string; title: string; excerpt: string | null;
  author: string; tags: string[]; published_at: string;
}

export default async function BlogPage() {
  const db = createAnonClient();
  const { data } = await db
    .from('blog_posts')
    .select('id, slug, title, excerpt, author, tags, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const posts = (data ?? []) as Post[];

  return (
    <main style={{ minHeight: '100vh' }}>
      <SiteHeader />
      <div
        style={{ maxWidth: 760, margin: '0 auto', paddingTop: 'clamp(48px, 8vh, 80px)', paddingBottom: 80 }}
        className="px-4 sm:px-6 lg:px-8"
      >
        <p style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      10,
          letterSpacing: '3px',
          color:         '#b7ff61',
          textTransform: 'uppercase',
          marginBottom:  20,
        }}>
          // BLOG
        </p>
        <h1 style={{
          fontFamily:   'var(--font-heading)',
          fontWeight:   700,
          fontSize:     'clamp(26px, 4vw, 40px)',
          color:        '#f2faf4',
          marginBottom: 48,
          lineHeight:   1.1,
        }}>
          From the team.
        </h1>

        {posts.length === 0 && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#5b8a9a' }}>
            No posts yet. Check back soon.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {posts.map((post, i) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              style={{
                display:        'block',
                textDecoration: 'none',
                padding:        '32px 0',
                borderTop:      i === 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                borderBottom:   '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {post.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  {post.tags.map(tag => (
                    <span key={tag} style={{
                      fontFamily:    'var(--font-mono)',
                      fontSize:      9,
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                      color:         '#22d3ee',
                      border:        '1px solid rgba(34,211,238,0.2)',
                      padding:       '2px 8px',
                      borderRadius:  2,
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <h2 style={{
                fontFamily:   'var(--font-heading)',
                fontWeight:   700,
                fontSize:     'clamp(18px, 2.5vw, 26px)',
                color:        '#f2faf4',
                marginBottom: 10,
                lineHeight:   1.2,
              }}>
                {post.title}
              </h2>
              {post.excerpt && (
                <p style={{
                  fontFamily:   'var(--font-mono)',
                  fontSize:     13,
                  color:        '#aab8b1',
                  lineHeight:   1.7,
                  marginBottom: 12,
                }}>
                  {post.excerpt}
                </p>
              )}
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5b8a9a' }}>
                  {post.author}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5b8a9a' }}>
                  {new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#b7ff61' }}>
                  Read →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
