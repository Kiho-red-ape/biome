'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Post {
  id: string; slug: string; title: string; excerpt: string | null;
  hook: string | null; content: string; author: string;
  tags: string[]; status: string; published_at: string | null;
  artifact_url: string | null; artifact_label: string | null;
}

interface Props { post: Post | null }

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const inputStyle: React.CSSProperties = {
  fontFamily:   'var(--font-mono)',
  fontSize:     12,
  color:        '#f8fafc',
  background:   'rgba(255,255,255,0.04)',
  border:       '1px solid rgba(255,255,255,0.1)',
  borderRadius: 2,
  padding:      '8px 12px',
  width:        '100%',
  outline:      'none',
  boxSizing:    'border-box',
};

const labelStyle: React.CSSProperties = {
  fontFamily:    'var(--font-mono)',
  fontSize:      10,
  color:         '#475569',
  letterSpacing: '1px',
  display:       'block',
  marginBottom:  6,
};

const hintStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize:   10,
  color:      '#3a4a43',
  marginTop:  4,
};

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 20, marginTop: 4 }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2.5px', color: '#ffb300', textTransform: 'uppercase', marginBottom: 14 }}>
        // {label}
      </p>
    </div>
  );
}

export function BlogEditor({ post }: Props) {
  const router = useRouter();

  const [title,         setTitle]         = useState(post?.title         ?? '');
  const [slug,          setSlug]          = useState(post?.slug          ?? '');
  const [excerpt,       setExcerpt]       = useState(post?.excerpt       ?? '');
  const [hook,          setHook]          = useState(post?.hook          ?? '');
  const [content,       setContent]       = useState(post?.content       ?? '');
  const [author,        setAuthor]        = useState(post?.author        ?? 'Kishore Ramesh Kumar');
  const [tags,          setTags]          = useState(post?.tags?.join(', ') ?? '');
  const [status,        setStatus]        = useState(post?.status        ?? 'draft');
  const [artifactUrl,   setArtifactUrl]   = useState(post?.artifact_url  ?? '');
  const [artifactLabel, setArtifactLabel] = useState(post?.artifact_label ?? 'Download worksheet');
  const [saving,        setSaving]        = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [error,         setError]         = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!post) setSlug(slugify(val));
  }

  async function save(newStatus?: string) {
    if (!title.trim() || !slug.trim() || !content.trim()) {
      setError('Title, slug, and substance (content) are required.');
      return;
    }
    setSaving(true);
    setError('');
    const finalStatus = newStatus ?? status;
    const body = {
      title:         title.trim(),
      slug:          slug.trim(),
      excerpt:       excerpt.trim() || null,
      hook:          hook.trim() || null,
      content:       content.trim(),
      author:        author.trim() || 'Kishore Ramesh Kumar',
      tags:          tags.split(',').map(t => t.trim()).filter(Boolean),
      status:        finalStatus,
      artifact_url:  artifactUrl.trim() || null,
      artifact_label: artifactUrl.trim() ? (artifactLabel.trim() || 'Download worksheet') : null,
      published_at:  finalStatus === 'published'
        ? (post?.published_at ?? new Date().toISOString())
        : null,
    };

    try {
      const res = await fetch('/api/ops/blog', {
        method:  post ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(post ? { id: post.id, ...body } : body),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push('/ops/blog');
      router.refresh();
    } catch (e) {
      setError(String(e));
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!post) return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch('/api/ops/blog', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: post.id }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Delete failed');
      }
      router.push('/ops/blog');
      router.refresh();
    } catch (e) {
      setError(String(e));
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px', color: '#ffb300', textTransform: 'uppercase', marginBottom: 24 }}>
        // {post ? 'EDIT_POST' : 'NEW_POST'}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ─ METADATA ─ */}
        <SectionDivider label="METADATA" />

        <div>
          <label style={labelStyle}>TITLE *</label>
          <input type="text" value={title} onChange={(e) => handleTitleChange(e.target.value)} style={{ ...inputStyle, fontSize: 16 }} placeholder="Post title" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>SLUG *</label>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} style={inputStyle} placeholder="post-slug" />
          </div>
          <div>
            <label style={labelStyle}>AUTHOR</label>
            <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>TAGS (comma-separated)</label>
          <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} style={inputStyle} placeholder="microbiome, research, ops" />
        </div>

        <div>
          <label style={labelStyle}>EXCERPT</label>
          <input type="text" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} style={inputStyle} placeholder="One-line SEO description (optional)" />
          <p style={hintStyle}>Appears in search results and blog index cards. Not shown on post page.</p>
        </div>

        {/* ─ PUBLIC HOOK ─ */}
        <SectionDivider label="PUBLIC_HOOK" />
        <div>
          <label style={labelStyle}>HOOK — TOP OF FOLD, FULLY VISIBLE</label>
          <textarea
            value={hook}
            onChange={(e) => setHook(e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
            placeholder="The compelling opener. 1–4 sentences that make someone stop scrolling. This appears prominently above the main body, always visible — no gate."
          />
          <p style={hintStyle}>Displayed large at the top. This is what people see before they commit to reading.</p>
        </div>

        {/* ─ SUBSTANCE ─ */}
        <SectionDivider label="SUBSTANCE" />
        <div>
          <label style={labelStyle}>SUBSTANCE — THE FRAMEWORK BODY *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={24}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
            placeholder="The full framework, analysis, or argument. Fully readable on the post page — no gate. Use blank lines to separate paragraphs."
          />
          <p style={hintStyle}>The meat. Fully public — no email gate on this section. Gate only applies to the downloadable artifact.</p>
        </div>

        {/* ─ GATED ARTIFACT ─ */}
        <SectionDivider label="GATED_ARTIFACT" />
        <div style={{ padding: '16px 20px', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 2, background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
            Optional. If provided, readers give their email to download this file. Appears as a call-to-action at the end of the post.
          </p>
          <div>
            <label style={labelStyle}>ARTIFACT URL (PDF, JPEG, or any file URL)</label>
            <input
              type="url"
              value={artifactUrl}
              onChange={(e) => setArtifactUrl(e.target.value)}
              style={inputStyle}
              placeholder="https://... (Google Drive, Dropbox, S3, or direct link)"
            />
            <p style={hintStyle}>Upload the file externally and paste the public URL here. Google Drive: File → Share → "Anyone with the link" → Copy.</p>
          </div>
          {artifactUrl && (
            <div>
              <label style={labelStyle}>DOWNLOAD BUTTON LABEL</label>
              <input
                type="text"
                value={artifactLabel}
                onChange={(e) => setArtifactLabel(e.target.value)}
                style={inputStyle}
                placeholder="Download worksheet"
              />
            </div>
          )}
        </div>

        {/* ─ STATUS + ACTIONS ─ */}
        <SectionDivider label="PUBLISH" />

        <div>
          <label style={labelStyle}>STATUS</label>
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
                  color:         status === s ? '#ffb300' : '#475569',
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

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 8, alignItems: 'center' }}>
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
            {saving ? 'Saving…' : post ? 'Save changes' : 'Create draft'}
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
                background:    'rgba(245,158,11,0.08)',
                border:        '1px solid rgba(245,158,11,0.3)',
                color:         '#f59e0b',
                borderRadius:  2,
                cursor:        saving ? 'not-allowed' : 'pointer',
              }}
            >
              Publish →
            </button>
          )}

          {/* Delete — only for drafts/archived */}
          {post && status !== 'published' && (
            <div style={{ marginLeft: 'auto' }}>
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  style={{
                    fontFamily:    'var(--font-mono)',
                    fontSize:      10,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    padding:       '5px 14px',
                    background:    'transparent',
                    border:        '1px solid rgba(255,80,80,0.2)',
                    color:         '#7a3a3a',
                    borderRadius:  2,
                    cursor:        'pointer',
                  }}
                >
                  Delete draft
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#ff6b6b' }}>Are you sure?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{
                      fontFamily:    'var(--font-mono)',
                      fontSize:      10,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      padding:       '5px 14px',
                      background:    'rgba(255,80,80,0.1)',
                      border:        '1px solid rgba(255,80,80,0.4)',
                      color:         '#ff6b6b',
                      borderRadius:  2,
                      cursor:        deleting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {deleting ? 'Deleting…' : 'Yes, delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    style={{
                      fontFamily:    'var(--font-mono)',
                      fontSize:      10,
                      padding:       '5px 14px',
                      background:    'transparent',
                      border:        '1px solid rgba(255,255,255,0.1)',
                      color:         '#475569',
                      borderRadius:  2,
                      cursor:        'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
