import { createAnonClient } from '@/lib/supabase/anon';
import Link from 'next/link';

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  author: string;
  tags: string[];
  published_at: string;
}

export async function BlogPreview() {
  const db = createAnonClient();

  let posts: Post[] = [];
  try {
    const { data } = await db
      .from('blog_posts')
      .select('id, slug, title, excerpt, author, tags, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3);
    posts = (data ?? []) as Post[];
  } catch {
    return null;
  }

  if (posts.length === 0) return null;

  return (
    <section
      style={{ paddingTop: 0, paddingBottom: 96, maxWidth: 900, margin: '0 auto' }}
      className="px-4 sm:px-6 lg:px-10"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 40 }}>
        <p style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      10,
          letterSpacing: '3px',
          color:         '#b7ff61',
          textTransform: 'uppercase',
          margin:        0,
        }}>
          // LATEST
        </p>
        <Link
          href="/blog"
          style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      11,
            color:         '#5b8a9a',
            textDecoration: 'none',
            transition:    'color 150ms ease',
          }}
        >
          All posts →
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {posts.map((post, i) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            style={{
              display:        'block',
              textDecoration: 'none',
              padding:        '28px 0',
              borderTop:      i === 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              borderBottom:   '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {post.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    {post.tags.slice(0, 2).map(tag => (
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
                <h3 style={{
                  fontFamily:   'var(--font-heading)',
                  fontWeight:   700,
                  fontSize:     'clamp(16px, 2vw, 20px)',
                  color:        '#f2faf4',
                  lineHeight:   1.25,
                  margin:       0,
                }}>
                  {post.title}
                </h3>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5b8a9a', margin: 0 }}>
                  {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
            {post.excerpt && (
              <p style={{
                fontFamily:   'var(--font-mono)',
                fontSize:     12,
                color:        '#5b8a9a',
                lineHeight:   1.7,
                marginTop:    10,
                marginBottom: 0,
              }}>
                {post.excerpt}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
