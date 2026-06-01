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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 32 }}>
        <p style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      10,
          letterSpacing: '3px',
          color:         '#f59e0b',
          textTransform: 'uppercase',
          margin:        0,
        }}>
          Latest
        </p>
        <Link
          href="/blog"
          style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      11,
            color:         '#475569',
            textDecoration: 'none',
            transition:    'color 150ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#475569'; }}
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
              borderTop:      i === 0 ? '1px solid rgba(248,250,252,0.07)' : 'none',
              borderBottom:   '1px solid rgba(248,250,252,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {post.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    {post.tags.slice(0, 2).map(tag => (
                      <span key={tag} style={{
                        fontFamily:    'var(--font-mono)',
                        fontSize:      9,
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase',
                        color:         '#38bdf8',
                        border:        '1px solid rgba(56,189,248,0.2)',
                        padding:       '2px 8px',
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <h3 style={{
                  fontFamily:   'var(--font-heading)',
                  fontWeight:   600,
                  fontSize:     'clamp(15px, 2vw, 18px)',
                  color:        '#e2e8f0',
                  lineHeight:   1.3,
                  margin:       0,
                }}>
                  {post.title}
                </h3>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#475569', margin: 0 }}>
                  {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
            {post.excerpt && (
              <p style={{
                fontFamily:   'var(--font-body)',
                fontSize:     13,
                color:        '#475569',
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
