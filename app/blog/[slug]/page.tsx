import { createAnonClient } from '@/lib/supabase/anon';
import { SiteHeader } from '@/components/nav/header';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArtifactGate } from './artifact-gate';

interface Post {
  id: string; slug: string; title: string; excerpt: string | null;
  hook: string | null; content: string; author: string;
  tags: string[]; published_at: string;
  artifact_url: string | null; artifact_label: string | null;
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = createAnonClient();
  const { data } = await db
    .from('blog_posts')
    .select('id, slug, title, excerpt, hook, content, author, tags, published_at, artifact_url, artifact_label')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!data) notFound();
  const post = data as Post;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <SiteHeader />

      {/* ── Post header (teal-soft) ── */}
      <section style={{ background: 'var(--teal-soft)', borderBottom: '1px solid var(--border-mid)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(40px, 6vw, 72px) 24px' }}>

          {/* Back link */}
          <Link href="/blog" style={{
            fontFamily:     'var(--font-body)',
            fontSize:       13,
            fontWeight:     600,
            color:          'var(--teal-dark)',
            textDecoration: 'none',
            display:        'inline-block',
            marginBottom:   32,
            letterSpacing:  '0.5px',
          }}>
            ← Blog
          </Link>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {post.tags.map(tag => (
                <span key={tag} style={{
                  fontFamily:    'var(--font-mono)',
                  fontSize:      10,
                  fontWeight:    600,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  background:    'var(--teal-faint)',
                  color:         'var(--teal-dark)',
                  padding:       '3px 8px',
                  borderRadius:  'var(--radius-sm)',
                  border:        '1px solid var(--teal-soft)',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 style={{
            fontFamily:   'var(--font-display)',
            fontWeight:   700,
            fontSize:     'clamp(26px, 4vw, 44px)',
            color:        'var(--ink)',
            lineHeight:   1.1,
            marginBottom: 24,
          }}>
            {post.title}
          </h1>

          {/* Meta */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize:   13,
              fontWeight: 500,
              color:      'var(--slate)',
            }}>
              {post.author}
            </span>
            <span style={{ width: 4, height: 4, background: 'var(--teal)', borderRadius: '50%', display: 'inline-block' }} />
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize:   13,
              color:      'var(--muted)',
            }}>
              {new Date(post.published_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </section>

      {/* ── Post body ── */}
      <section style={{ background: 'var(--bg-page)', borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(40px, 6vw, 72px) 24px' }}>

          {/* Hook — prominent pull quote */}
          {post.hook && (
            <div style={{
              borderLeft:   '4px solid var(--teal)',
              paddingLeft:  28,
              marginBottom: 48,
            }}>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize:   'clamp(18px, 2.5vw, 24px)',
                color:      'var(--ink)',
                lineHeight: 1.4,
                margin:     0,
              }}>
                {post.hook}
              </p>
            </div>
          )}

          {/* Main body */}
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize:   16,
            color:      'var(--slate)',
            lineHeight: 1.8,
            whiteSpace: 'pre-wrap',
            wordBreak:  'break-word',
          }}>
            {post.content}
          </div>

          {/* ── Gated artifact ── */}
          {post.artifact_url && (
            <div style={{
              marginTop:    64,
              border:       '1px solid var(--border-soft)',
              boxShadow:    'var(--shadow-md)',
              background:   'var(--surface)',
              borderRadius: 'var(--radius)',
              padding:      '36px 32px',
            }}>
              <span style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      11,
                fontWeight:    600,
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color:         'var(--teal-dark)',
                display:       'block',
                marginBottom:  12,
              }}>
                Free Resource
              </span>
              <h2 style={{
                fontFamily:   'var(--font-display)',
                fontWeight:   700,
                fontSize:     'clamp(18px, 2.5vw, 24px)',
                color:        'var(--ink)',
                marginBottom: 8,
              }}>
                {post.artifact_label ?? 'Download the worksheet'}
              </h2>
              <p style={{
                fontFamily:   'var(--font-body)',
                fontSize:     14,
                color:        'var(--slate)',
                lineHeight:   1.6,
                marginBottom: 24,
              }}>
                Enter your email and we'll send you the template directly.
              </p>
              <ArtifactGate
                artifactUrl={post.artifact_url}
                artifactLabel={post.artifact_label ?? 'Download worksheet'}
                postSlug={post.slug}
              />
            </div>
          )}

          {/* Back link */}
          <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid var(--border-soft)' }}>
            <Link href="/blog" style={{
              fontFamily:     'var(--font-body)',
              fontSize:       13,
              fontWeight:     600,
              color:          'var(--teal-dark)',
              textDecoration: 'none',
              letterSpacing:  '0.5px',
            }}>
              ← Back to blog
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border-soft)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <Link href="/" style={{ fontFamily: 'var(--font-logo)', fontWeight: 700, fontSize: 18, letterSpacing: '2px', color: 'var(--ink)', textDecoration: 'none' }}>
            Bio<span style={{ color: 'var(--teal)' }}>me</span>
          </Link>
          <nav style={{ display: 'flex', gap: 24 }}>
            {[['Blog', '/blog'], ['Docs', '/docs'], ['Terms', '/legal/tos'], ['Privacy', '/privacy']].map(([l, h]) => (
              <a key={h} href={h} className="footer-link">{l}</a>
            ))}
          </nav>
        </div>
      </footer>
    </main>
  );
}
