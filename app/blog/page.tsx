import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';

type Post = {
  id:           string;
  title:        string;
  slug:         string;
  hook:         string;
  tags:         string[];
  published_at: string | null;
  gated_artifact_label: string | null;
  gated_artifact_type:  string | null;
};

async function getPosts(): Promise<Post[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('blog_posts')
    .select('id, title, slug, hook, tags, published_at, gated_artifact_label, gated_artifact_type')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  return (data ?? []) as Post[];
}

function formatDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Nav */}
      <div style={{
        borderBottom: '1px solid rgba(77,255,128,0.07)',
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <Link href="/" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: '#4a7055', textDecoration: 'none' }}>
          ← BIOME
        </Link>
        <span style={{ color: 'rgba(77,255,128,0.15)' }}>|</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '2px', color: '#4a7055', textTransform: 'uppercase' }}>
          Blog
        </span>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6" style={{ paddingTop: 52, paddingBottom: 80 }}>

        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--green)', marginBottom: 10 }}>
          // BIOME BLOG
        </p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 34, fontWeight: 800, color: 'var(--text-white)', marginBottom: 10, lineHeight: 1.15 }}>
          Research, frameworks, field notes
        </h1>
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: '#aab8b1', lineHeight: 1.7, marginBottom: 48, maxWidth: 520 }}>
          Guides and frameworks for running high-quality human studies — recruitment, study design, participant management, and data collection.
        </p>

        {posts.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#4a7055' }}>No posts yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {posts.map((post, i) => (
              <article
                key={post.id}
                style={{
                  padding: '28px 0',
                  borderTop: i > 0 ? '1px solid rgba(77,255,128,0.07)' : 'none',
                }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                  {post.tags.slice(0, 3).map(tag => (
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

                <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, color: 'var(--text-white)', marginBottom: 10, lineHeight: 1.25 }}>
                    {post.title}
                  </h2>
                </Link>

                {post.hook && (
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: '#aab8b1', lineHeight: 1.75, marginBottom: 14 }}>
                    {post.hook.length > 220 ? post.hook.slice(0, 220) + '…' : post.hook}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <Link href={`/blog/${post.slug}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--green)', textDecoration: 'none' }}>
                    Read →
                  </Link>
                  {post.gated_artifact_type && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#ffb300' }}>
                      ↓ Free {post.gated_artifact_type === 'pdf' ? 'PDF' : 'worksheet'} inside
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
