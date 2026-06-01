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

  const MONO = 'var(--font-mono)';
  const HEAD = 'var(--font-heading)';

  return (
    <main style={{ minHeight: '100vh' }}>
      <SiteHeader />
      <article
        style={{ maxWidth: 680, margin: '0 auto', paddingTop: 'clamp(48px, 8vh, 80px)', paddingBottom: 96 }}
        className="px-4 sm:px-6 lg:px-8"
      >
        {/* Back */}
        <Link
          href="/blog"
          style={{ fontFamily: MONO, fontSize: 11, color: '#475569', textDecoration: 'none', letterSpacing: '0.5px', display: 'inline-block', marginBottom: 40 }}
        >
          ← Blog
        </Link>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {post.tags.map(tag => (
              <span key={tag} style={{
                fontFamily: MONO, fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase',
                color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)', padding: '2px 8px', borderRadius: 2,
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 'clamp(26px, 4vw, 44px)', color: '#f8fafc', lineHeight: 1.1, marginBottom: 16 }}>
          {post.title}
        </h1>

        {/* Meta */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 40, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: MONO, fontSize: 12, color: '#475569' }}>{post.author}</span>
          <span style={{ fontFamily: MONO, fontSize: 12, color: '#475569' }}>
            {new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        {/* ── PUBLIC HOOK — top of fold, always visible ── */}
        {post.hook && (
          <div style={{
            marginBottom: 48, paddingBottom: 40,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <p style={{
              fontFamily: HEAD, fontWeight: 700,
              fontSize:   'clamp(18px, 2.5vw, 24px)',
              color:      '#f8fafc',
              lineHeight: 1.4,
            }}>
              {post.hook}
            </p>
          </div>
        )}

        {/* ── SUBSTANCE — main body ── */}
        <div style={{
          fontFamily: MONO, fontSize: 14, color: '#94a3b8',
          lineHeight: 1.9, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          marginBottom: post.artifact_url ? 64 : 0,
        }}>
          {post.content}
        </div>

        {/* ── GATED ARTIFACT ── */}
        {post.artifact_url && (
          <div style={{
            marginTop: 64, paddingTop: 48, borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '3px', color: '#f59e0b', textTransform: 'uppercase', marginBottom: 16 }}>
              // FREE_RESOURCE
            </p>
            <h2 style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 'clamp(18px, 2.5vw, 24px)', color: '#f8fafc', marginBottom: 8 }}>
              {post.artifact_label ?? 'Download the worksheet'}
            </h2>
            <p style={{ fontFamily: MONO, fontSize: 12, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
              Enter your email and we'll send you the template directly.
            </p>
            <ArtifactGate
              artifactUrl={post.artifact_url}
              artifactLabel={post.artifact_label ?? 'Download worksheet'}
              postSlug={post.slug}
            />
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link
            href="/blog"
            style={{ fontFamily: MONO, fontSize: 11, color: '#475569', textDecoration: 'none', letterSpacing: '0.5px' }}
          >
            ← Back to blog
          </Link>
        </div>
      </article>
    </main>
  );
}
