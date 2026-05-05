import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import ArtifactGate from './artifact-gate';

type Post = {
  id:                   string;
  title:                string;
  slug:                 string;
  hook:                 string;
  content:              string;
  gated_artifact_url:   string | null;
  gated_artifact_label: string | null;
  gated_artifact_type:  'pdf' | 'image' | null;
  tags:                 string[];
  published_at:         string | null;
  author_id:            string | null;
};

async function getPost(slug: string): Promise<Post | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  return (data ?? null) as Post | null;
}

function formatDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const paragraphs = (text: string) =>
    text.split(/\n{2,}/).map((p, i) => (
      <p key={i} style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: '#c0d4c4', lineHeight: 1.85, marginBottom: 20 }}>
        {p.split('\n').map((line, j) => (
          <span key={j}>{line}{j < p.split('\n').length - 1 && <br />}</span>
        ))}
      </p>
    ));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Nav */}
      <div style={{ borderBottom: '1px solid rgba(77,255,128,0.07)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/blog" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: '#4a7055', textDecoration: 'none' }}>
          ← Blog
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6" style={{ paddingTop: 52, paddingBottom: 80 }}>

        {/* Tags + date */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
          {post.tags.map(tag => (
            <span key={tag} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: '#4a7055', background: 'rgba(77,255,128,0.05)', border: '1px solid rgba(77,255,128,0.10)', borderRadius: 2, padding: '3px 7px' }}>
              {tag}
            </span>
          ))}
          {post.published_at && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a7055' }}>
              {formatDate(post.published_at)}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 36, fontWeight: 800, color: 'var(--text-white)', lineHeight: 1.15, marginBottom: 28 }}>
          {post.title}
        </h1>

        {/* ── SECTION 1: PUBLIC HOOK ───────────────────────────────────────── */}
        {post.hook && (
          <div style={{
            marginBottom: 36,
            padding: '20px 22px',
            background: 'rgba(77,255,128,0.03)',
            border: '1px solid rgba(77,255,128,0.10)',
            borderLeft: '3px solid var(--green)',
            borderRadius: 3,
          }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--green)', marginBottom: 10 }}>
              // THE HOOK
            </p>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 17, color: 'var(--text-white)', lineHeight: 1.75, fontWeight: 500 }}>
              {post.hook}
            </p>
          </div>
        )}

        <div style={{ borderTop: '1px solid rgba(77,255,128,0.08)', marginBottom: 36 }} />

        {/* ── SECTION 2: SUBSTANCE (full article) ─────────────────────────── */}
        {post.content && (
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: 20 }}>
              // THE SUBSTANCE
            </p>
            <div style={{ lineHeight: 1.85 }}>
              {paragraphs(post.content)}
            </div>
          </div>
        )}

        {/* ── SECTION 3: GATED ARTIFACT ────────────────────────────────────── */}
        {post.gated_artifact_url && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: '#ffb300', marginBottom: 16 }}>
              // THE ARTIFACT
            </p>
            <ArtifactGate
              postId={post.id}
              label={post.gated_artifact_label ?? 'Download the resource'}
              type={post.gated_artifact_type ?? 'pdf'}
            />
          </div>
        )}

        {/* Footer nav */}
        <div style={{ marginTop: 56, paddingTop: 24, borderTop: '1px solid rgba(77,255,128,0.08)' }}>
          <Link href="/blog" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4a7055', textDecoration: 'none' }}>
            ← Back to blog
          </Link>
        </div>
      </div>
    </div>
  );
}
