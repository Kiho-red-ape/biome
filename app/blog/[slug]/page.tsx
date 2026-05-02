import { createAnonClient } from '@/lib/supabase/anon';
import { SiteHeader } from '@/components/nav/header';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface Post {
  id: string; slug: string; title: string; excerpt: string | null;
  content: string; author: string; tags: string[]; published_at: string;
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = createAnonClient();
  const { data } = await db
    .from('blog_posts')
    .select('id, slug, title, excerpt, content, author, tags, published_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!data) notFound();
  const post = data as Post;

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
          style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      11,
            color:         '#5b8a9a',
            textDecoration: 'none',
            letterSpacing: '0.5px',
            display:       'inline-block',
            marginBottom:  40,
          }}
        >
          ← Blog
        </Link>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
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

        {/* Title */}
        <h1 style={{
          fontFamily:   'var(--font-heading)',
          fontWeight:   700,
          fontSize:     'clamp(26px, 4vw, 44px)',
          color:        '#f2faf4',
          lineHeight:   1.1,
          marginBottom: 16,
        }}>
          {post.title}
        </h1>

        {/* Meta */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 48, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#5b8a9a' }}>{post.author}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#5b8a9a' }}>
            {new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        {/* Excerpt */}
        {post.excerpt && (
          <p style={{
            fontFamily:   'var(--font-mono)',
            fontSize:     14,
            color:        '#aab8b1',
            lineHeight:   1.8,
            marginBottom: 40,
            paddingBottom: 40,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            fontStyle:    'italic',
          }}>
            {post.excerpt}
          </p>
        )}

        {/* Content */}
        <div style={{
          fontFamily:  'var(--font-mono)',
          fontSize:    14,
          color:       '#aab8b1',
          lineHeight:  1.9,
          whiteSpace:  'pre-wrap',
          wordBreak:   'break-word',
        }}>
          {post.content}
        </div>

        {/* Footer */}
        <div style={{
          marginTop:   64,
          paddingTop:  32,
          borderTop:   '1px solid rgba(255,255,255,0.06)',
        }}>
          <Link
            href="/blog"
            style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      11,
              color:         '#5b8a9a',
              textDecoration: 'none',
              letterSpacing: '0.5px',
            }}
          >
            ← Back to blog
          </Link>
        </div>
      </article>
    </main>
  );
}
