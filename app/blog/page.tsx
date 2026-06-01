import { createAnonClient } from '@/lib/supabase/anon';
import { SiteHeader } from '@/components/nav/header';
import { BlogHeaderSVG } from '@/components/illustrations/PageIllustrations';
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

      {/* ── Hero (navy, two-column) ── */}
      <section style={{
        background:   'var(--navy)',
        borderBottom: '3px solid var(--black)',
      }}>
        <div
          style={{
            maxWidth:            1200,
            margin:              '0 auto',
            padding:             'clamp(48px, 8vw, 96px) 24px',
            display:             'grid',
            gridTemplateColumns: 'minmax(0, 58%) minmax(0, 42%)',
            gap:                 56,
            alignItems:          'center',
          }}
          className="blog-hero-grid"
        >
          {/* Left */}
          <div>
            <span style={{
              fontFamily:    'var(--font-display)',
              fontSize:      13,
              fontWeight:    600,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color:         'var(--amber)',
              display:       'block',
              marginBottom:  20,
            }}>
              Blog
            </span>
            <h1 style={{
              fontFamily:   'var(--font-display)',
              fontWeight:   700,
              fontSize:     'clamp(28px, 4vw, 52px)',
              lineHeight:   1.08,
              color:        'var(--white)',
              marginBottom: 20,
            }}>
              From the team.
            </h1>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize:   17,
              color:      'rgba(255,255,255,0.65)',
              lineHeight: 1.6,
              maxWidth:   440,
            }}>
              Research operations, study design, and the infrastructure behind modern human studies.
            </p>
          </div>

          {/* Right — blog illustration */}
          <div className="blog-hero-art" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BlogHeaderSVG />
          </div>
        </div>
      </section>

      {/* ── Posts (off-white) ── */}
      <section style={{ background: 'var(--off-white)', borderBottom: '3px solid var(--black)' }}>
        <div className="section-inner">

          {posts.length === 0 ? (
            <div style={{
              border:     '3px solid var(--black)',
              background: 'var(--white)',
              boxShadow:  '5px 5px 0 var(--black)',
              padding:    '48px 40px',
              maxWidth:   480,
            }}>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize:   18,
                fontWeight: 600,
                color:      'var(--black)',
                margin:     0,
              }}>
                No posts yet. Check back soon.
              </p>
            </div>
          ) : (
            <div
              style={{
                display:             'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap:                 28,
              }}
              className="blog-posts-grid"
            >
              {posts.map(post => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  style={{ textDecoration: 'none' }}
                  className="blog-card-link"
                >
                  <article
                    className="blog-card"
                    style={{
                      background:  'var(--white)',
                      border:      '3px solid var(--black)',
                      boxShadow:   '4px 4px 0 var(--black)',
                      padding:     '28px 24px',
                      height:      '100%',
                      display:     'flex',
                      flexDirection: 'column',
                      transition:  'box-shadow 150ms, transform 150ms',
                    }}
                  >
                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                        {post.tags.map(tag => (
                          <span key={tag} style={{
                            fontFamily:    'var(--font-display)',
                            fontSize:      10,
                            fontWeight:    600,
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            background:    'var(--amber)',
                            color:         'var(--black)',
                            padding:       '3px 8px',
                            border:        '2px solid var(--black)',
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Title */}
                    <h2 style={{
                      fontFamily:   'var(--font-display)',
                      fontWeight:   600,
                      fontSize:     20,
                      color:        'var(--black)',
                      lineHeight:   1.3,
                      marginBottom: 12,
                      flex:         1,
                    }}>
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p style={{
                        fontFamily:   'var(--font-body)',
                        fontSize:     14,
                        color:        'var(--gray)',
                        lineHeight:   1.6,
                        marginBottom: 20,
                      }}>
                        {post.excerpt}
                      </p>
                    )}

                    {/* Meta row */}
                    <div style={{
                      display:        'flex',
                      justifyContent: 'space-between',
                      alignItems:     'center',
                      borderTop:      '2px solid var(--black)',
                      paddingTop:     14,
                      marginTop:      'auto',
                    }}>
                      <div>
                        <span style={{
                          fontFamily: 'var(--font-body)',
                          fontSize:   12,
                          fontWeight: 500,
                          color:      'var(--black)',
                          display:    'block',
                        }}>
                          {post.author}
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-body)',
                          fontSize:   12,
                          color:      'var(--gray)',
                        }}>
                          {new Date(post.published_at).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric',
                          })}
                        </span>
                      </div>
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize:   13,
                        fontWeight: 700,
                        color:      'var(--black)',
                      }}>
                        Read →
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--black)', borderTop: '3px solid rgba(255,255,255,0.1)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '2px', color: 'var(--white)', textDecoration: 'none' }}>
            BIO<span style={{ color: 'var(--amber)' }}>ME</span>
          </Link>
          <nav style={{ display: 'flex', gap: 24 }}>
            {[['Blog', '/blog'], ['Docs', '/docs'], ['Terms', '/legal/tos'], ['Privacy', '/privacy']].map(([l, h]) => (
              <a key={h} href={h} className="footer-link">{l}</a>
            ))}
          </nav>
        </div>
      </footer>

      <style>{`
        .blog-card:hover { box-shadow: 6px 6px 0 var(--amber) !important; transform: translate(-2px, -2px); }
        @media (max-width: 768px) {
          .blog-hero-grid  { grid-template-columns: 1fr !important; gap: 0 !important; }
          .blog-hero-art   { display: none !important; }
          .blog-posts-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .blog-posts-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </main>
  );
}
