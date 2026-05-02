'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Post {
  id: string; slug: string; title: string; excerpt: string | null;
  content: string; author: string; tags: string[]; status: string;
  published_at: string | null;
}

interface Props { post: Post | null }

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function BlogEditor({ post }: Props) {
  const router = useRouter();
  const [title,   setTitle]   = useState(post?.title   ?? '');
  const [slug,    setSlug]    = useState(post?.slug    ?? '');
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '');
  const [content, setContent] = useState(post?.content ?? '');
  const [author,  setAuthor]  = useState(post?.author  ?? 'Kishore Ramesh Kumar');
  const [tags,    setTags]    = useState(post?.tags?.join(', ') ?? '');
  const [status,  setStatus]  = useState(post?.status  ?? 'draft');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!post) setSlug(slugify(val));
  }

  async function save(newStatus?: string) {
    if (!title.trim() || !slug.trim() || !content.trim()) {
      setError('Title, slug, and content are required.');
      return;
    }
    setSaving(true);
    setError('');
    const finalStatus = newStatus ?? status;
    const body = {
      title:       title.trim(),
      slug:        slug.trim(),
      excerpt:     excerpt.trim() || null,
      content:     content.trim(),
      author:      author.trim() || 'Kishore Ramesh Kumar',
      tags:        tags.split(',').map(t => t.trim()).filter(Boolean),
      status:      finalStatus,
      published_at: finalStatus === 'published' ? (post?.published_at ?? new Date().toISOString()) : null,
    };

    try {
      const res = await fetch('/api/ops/blog', {
        method:  post ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(post ? { id: post.id, ...body } : body),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push('/ops/blog');
    } catch (e) {
      setError(String(e));
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    fontFamily:    'var(--font-mono)',
    fontSize:      12,
    color:         '#f2faf4',
    background:    'rgba(255,255,255,0.04)',
    border:        '1px solid rgba(255,255,255,0.1)',
    borderRadius:  2,
    padding:       '8px 12px',
    width:         '100%',
    outline:       'none',
    boxSizing:     'border-box',
  };

  return (
    <div style={{ maxWidth: 760 }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px', color: '#ffb300', textTransform: 'uppercase', marginBottom: 24 }}>
        // {post ? 'EDIT_POST' : 'NEW_POST'}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Title */}
        <div>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5b8a9a', letterSpacing: '1px', display: 'block', marginBottom: 6 }}>TITLE</label>
          <input type="text" value={title} onChange={(e) => handleTitleChange(e.target.value)} style={{ ...inputStyle, fontSize: 16 }} placeholder="Post title" />
        </div>

        {/* Slug */}
        <div>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5b8a9a', letterSpacing: '1px', display: 'block', marginBottom: 6 }}>SLUG</label>
          <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} style={inputStyle} placeholder="post-slug" />
        </div>

        {/* Excerpt */}
        <div>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5b8a9a', letterSpacing: '1px', display: 'block', marginBottom: 6 }}>EXCERPT</label>
          <input type="text" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} style={inputStyle} placeholder="One-line summary (optional)" />
        </div>

        {/* Author + Tags row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5b8a9a', letterSpacing: '1px', display: 'block', marginBottom: 6 }}>AUTHOR</label>
            <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5b8a9a', letterSpacing: '1px', display: 'block', marginBottom: 6 }}>TAGS (comma-separated)</label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} style={inputStyle} placeholder="microbiome, research, ops" />
          </div>
        </div>

        {/* Content */}
        <div>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5b8a9a', letterSpacing: '1px', display: 'block', marginBottom: 6 }}>
            CONTENT <span style={{ color: '#3a4a43' }}>(plain text — use blank lines for paragraphs)</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
            placeholder="Write your post here…"
          />
        </div>

        {/* Status */}
        <div>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5b8a9a', letterSpacing: '1px', display: 'block', marginBottom: 8 }}>STATUS</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['draft', 'published', 'archived'].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                style={{
                  fontFamily:    'var(--font-mono)',
                  fontSize:      10,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  padding:       '5px 14px',
                  border:        `1px solid ${status === s ? '#ffb300' : 'rgba(255,255,255,0.1)'}`,
                  background:    status === s ? 'rgba(255,179,0,0.08)' : 'transparent',
                  color:         status === s ? '#ffb300' : '#5b8a9a',
                  borderRadius:  2,
                  cursor:        'pointer',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ff6b6b' }}>{error}</p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
          <button
            type="button"
            onClick={() => save()}
            disabled={saving}
            style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      11,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              padding:       '8px 24px',
              background:    'rgba(255,179,0,0.1)',
              border:        '1px solid rgba(255,179,0,0.4)',
              color:         '#ffb300',
              borderRadius:  2,
              cursor:        saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving…' : post ? 'Save changes' : 'Create post'}
          </button>
          {status !== 'published' && (
            <button
              type="button"
              onClick={() => save('published')}
              disabled={saving}
              style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      11,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                padding:       '8px 24px',
                background:    'rgba(183,255,97,0.08)',
                border:        '1px solid rgba(183,255,97,0.3)',
                color:         '#b7ff61',
                borderRadius:  2,
                cursor:        saving ? 'not-allowed' : 'pointer',
              }}
            >
              Publish →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
