import { createAnonClient } from '@/lib/supabase/anon';
import Link from 'next/link';

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  tags: string[];
  published_at: string;
}

export async function BlogPreview() {
  const db = createAnonClient();

  let posts: Post[] = [];
  try {
    const { data } = await db
      .from('blog_posts')
      .select('id, slug, title, excerpt, tags, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3);
    posts = (data ?? []) as Post[];
  } catch {
    return null;
  }

  if (posts.length === 0) return null;

  return (
    <section style={{ background: 'var(--off-white)', borderBottom: '3px solid var(--black)' }}>
      <div className="section-inner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <span className="section-label section-label-dark" style={{ marginBottom: 0 }}>Latest</span>
          <Link
            href="/blog"
            style={{
              fontFamily:  'var(--font-display)',
              fontSize:    14,
              fontWeight:  600,
              color:       'var(--black)',
              borderBottom: '2px solid var(--black)',
            }}
          >
            All posts →
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              style={{ display: 'block', textDecoration: 'none' }}
            >
              <div
                className="brutalist-card"
                style={{
                  display:    'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap:        24,
                  flexWrap:   'wrap',
                  transition: 'box-shadow 150ms ease, transform 150ms ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translate(-2px,-2px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '7px 7px 0 var(--amber)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'none';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '5px 5px 0 var(--black)';
                }}
              >
                <div style={{ flex: 1 }}>
                  {post.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                      {post.tags.slice(0, 2).map(tag => (
                        <span key={tag} style={{
                          fontFamily:    'var(--font-body)',
                          fontSize:      12,
                          fontWeight:    600,
                          letterSpacing: '1px',
                          textTransform: 'uppercase',
                          color:         'var(--black)',
                          background:    'var(--amber)',
                          padding:       '3px 10px',
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <h3 style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize:   20,
                    color:      'var(--black)',
                    lineHeight: 1.25,
                    margin:     0,
                  }}>
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--gray)', marginTop: 8 }}>
                      {post.excerpt}
                    </p>
                  )}
                </div>
                <p style={{
                  fontFamily:  'var(--font-body)',
                  fontSize:    13,
                  color:       'var(--gray)',
                  flexShrink:  0,
                  marginTop:   4,
                }}>
                  {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
