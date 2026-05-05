'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';

type Post = {
  id:           string;
  title:        string;
  slug:         string;
  hook:         string;
  status:       'draft' | 'published';
  published_at: string | null;
  created_at:   string;
  updated_at:   string;
  gated_artifact_label: string | null;
  gated_artifact_type:  string | null;
};

const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)' };

function relDate(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 30)  return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DraftsPage() {
  const router = useRouter();
  const { user, ready, authenticated } = usePrivy();

  const [posts,         setPosts]        = useState<Post[]>([]);
  const [loading,       setLoading]      = useState(true);
  const [deletingId,    setDeletingId]   = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete]= useState<string | null>(null);
  const [publishing,    setPublishing]   = useState<string | null>(null);
  const [error,         setError]        = useState('');

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user) { router.replace('/'); return; }
    fetch(`/api/blog?privyDid=${encodeURIComponent(user.id)}`)
      .then(r => r.json())
      .then((d: { posts?: Post[] }) => setPosts(d.posts ?? []))
      .finally(() => setLoading(false));
  }, [ready, authenticated, user, router]);

  async function handleDelete(id: string) {
    if (!user) return;
    setDeletingId(id);
    setError('');
    const res = await fetch(`/api/blog/${id}?privyDid=${encodeURIComponent(user.id)}`, { method: 'DELETE' });
    setDeletingId(null);
    setConfirmDelete(null);
    if (!res.ok) { setError('Delete failed. Try again.'); return; }
    setPosts(prev => prev.filter(p => p.id !== id));
  }

  async function handlePublish(post: Post) {
    if (!user) return;
    setPublishing(post.id);
    setError('');
    const res = await fetch(`/api/blog/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ privyDid: user.id, status: 'published' }),
    });
    setPublishing(null);
    if (!res.ok) { setError('Publish failed.'); return; }
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: 'published', published_at: new Date().toISOString() } : p));
  }

  if (!ready || loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ ...mono, fontSize: 11, color: '#4a7055' }}>Loading...</p>
    </div>
  );

  const drafts    = posts.filter(p => p.status === 'draft');
  const published = posts.filter(p => p.status === 'published');

  const PostRow = ({ post }: { post: Post }) => {
    const isConfirming = confirmDelete === post.id;
    const isDeleting   = deletingId   === post.id;
    const isPublishing = publishing   === post.id;

    return (
      <div style={{
        borderBottom: '1px solid rgba(77,255,128,0.06)',
        padding: '16px 20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ ...mono, fontSize: 13, color: 'var(--text-bright)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {post.title || '(untitled)'}
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ ...mono, fontSize: 10, color: post.status === 'published' ? 'var(--green)' : '#ffb300' }}>
                {post.status === 'published' ? '● PUBLISHED' : '○ DRAFT'}
              </span>
              {post.gated_artifact_type && (
                <span style={{ ...mono, fontSize: 9, color: '#ffb300', letterSpacing: '1px' }}>
                  ↓ {post.gated_artifact_type.toUpperCase()} GATED
                </span>
              )}
              <span style={{ ...mono, fontSize: 10, color: '#4a7055' }}>
                {relDate(post.updated_at)}
              </span>
              <span style={{ ...mono, fontSize: 10, color: '#4a7055' }}>
                /blog/{post.slug}
              </span>
            </div>
            {post.hook && (
              <p style={{ ...mono, fontSize: 11, color: '#4a7055', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 500 }}>
                {post.hook}
              </p>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            {isConfirming ? (
              <>
                <span style={{ ...mono, fontSize: 10, color: '#ff6b6b' }}>Delete permanently?</span>
                <button
                  onClick={() => handleDelete(post.id)}
                  disabled={isDeleting}
                  style={{ ...mono, fontSize: 10, letterSpacing: '1px', background: 'rgba(255,107,107,0.15)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 2, padding: '5px 10px', cursor: 'pointer' }}
                >
                  {isDeleting ? '...' : 'Confirm delete'}
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  style={{ ...mono, fontSize: 10, color: '#4a7055', background: 'transparent', border: '1px solid rgba(77,255,128,0.12)', borderRadius: 2, padding: '5px 10px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <Link
                  href={`/blog/write/${post.id}`}
                  style={{ ...mono, fontSize: 10, letterSpacing: '1px', color: 'var(--text)', background: 'transparent', border: '1px solid rgba(77,255,128,0.12)', borderRadius: 2, padding: '6px 12px', textDecoration: 'none' }}
                >
                  Edit
                </Link>
                {post.status === 'draft' && (
                  <button
                    onClick={() => handlePublish(post)}
                    disabled={isPublishing}
                    style={{ ...mono, fontSize: 10, letterSpacing: '1px', color: 'var(--green)', background: 'rgba(77,255,128,0.06)', border: '1px solid rgba(77,255,128,0.2)', borderRadius: 2, padding: '6px 12px', cursor: 'pointer' }}
                  >
                    {isPublishing ? '...' : 'Publish'}
                  </button>
                )}
                {post.status === 'published' && (
                  <Link
                    href={`/blog/${post.slug}`}
                    style={{ ...mono, fontSize: 10, letterSpacing: '1px', color: 'var(--cyan)', background: 'transparent', border: '1px solid rgba(0,229,255,0.15)', borderRadius: 2, padding: '6px 12px', textDecoration: 'none' }}
                  >
                    View →
                  </Link>
                )}
                <button
                  onClick={() => setConfirmDelete(post.id)}
                  style={{ ...mono, fontSize: 10, letterSpacing: '1px', color: '#ff6b6b', background: 'transparent', border: '1px solid rgba(255,107,107,0.15)', borderRadius: 2, padding: '6px 12px', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Nav */}
      <div style={{ borderBottom: '1px solid rgba(77,255,128,0.07)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/" style={{ ...mono, fontSize: 10, letterSpacing: '2px', color: '#4a7055', textDecoration: 'none' }}>← BIOME</Link>
        <span style={{ color: 'rgba(77,255,128,0.15)' }}>|</span>
        <span style={{ ...mono, fontSize: 10, letterSpacing: '2px', color: '#4a7055' }}>BLOG DRAFTS</span>
        <div style={{ marginLeft: 'auto' }}>
          <Link
            href="/blog/write"
            style={{ ...mono, fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', background: 'var(--green)', color: '#070c07', borderRadius: 3, padding: '8px 16px', textDecoration: 'none', fontWeight: 700 }}
          >
            + New post
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6" style={{ paddingTop: 44, paddingBottom: 80 }}>

        <p style={{ ...mono, fontSize: 9, letterSpacing: '3px', color: 'var(--green)', marginBottom: 10 }}>// POSTS</p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: 'var(--text-white)', marginBottom: 8 }}>
          Your posts
        </h1>
        <p style={{ ...mono, fontSize: 11, color: '#4a7055', marginBottom: 36 }}>
          {posts.length} post{posts.length !== 1 ? 's' : ''} total · {drafts.length} draft{drafts.length !== 1 ? 's' : ''} · {published.length} published
        </p>

        {error && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 3 }}>
            <p style={{ ...mono, fontSize: 11, color: '#ff6b6b' }}>{error}</p>
          </div>
        )}

        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <p style={{ ...mono, fontSize: 12, color: '#4a7055', marginBottom: 16 }}>No posts yet.</p>
            <Link href="/blog/write" style={{ ...mono, fontSize: 11, letterSpacing: '2px', background: 'var(--green)', color: '#070c07', borderRadius: 3, padding: '11px 22px', textDecoration: 'none', fontWeight: 700 }}>
              Write your first post →
            </Link>
          </div>
        ) : (
          <>
            {/* Drafts section */}
            {drafts.length > 0 && (
              <div style={{ marginBottom: 36 }}>
                <p style={{ ...mono, fontSize: 9, letterSpacing: '2px', color: '#ffb300', marginBottom: 12 }}>DRAFTS ({drafts.length})</p>
                <div style={{ border: '1px solid rgba(77,255,128,0.10)', borderRadius: 4, overflow: 'hidden' }}>
                  {drafts.map(p => <PostRow key={p.id} post={p} />)}
                </div>
              </div>
            )}

            {/* Published section */}
            {published.length > 0 && (
              <div>
                <p style={{ ...mono, fontSize: 9, letterSpacing: '2px', color: 'var(--green)', marginBottom: 12 }}>PUBLISHED ({published.length})</p>
                <div style={{ border: '1px solid rgba(77,255,128,0.10)', borderRadius: 4, overflow: 'hidden' }}>
                  {published.map(p => <PostRow key={p.id} post={p} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
