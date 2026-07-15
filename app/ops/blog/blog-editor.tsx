'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OpsPageHeader, OpsCard, OpsButton, OpsAlert } from '../_components/ui';

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

const INPUT: React.CSSProperties = {
  fontFamily:   'var(--font-mono)',
  fontSize:     12,
  color:        'var(--ink)',
  background:   'var(--bg-page)',
  border:       '1px solid var(--border-mid)',
  borderRadius: 'var(--radius-sm)',
  padding:      '9px 12px',
  width:        '100%',
  outline:      'none',
  boxSizing:    'border-box',
};

const LABEL: React.CSSProperties = {
  fontFamily:    'var(--font-mono)',
  fontSize:      9,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  color:         'var(--muted)',
  display:       'block',
  marginBottom:  6,
};

const HINT: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize:   10,
  color:      'var(--muted)',
  marginTop:  5,
};

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 20, marginTop: 8 }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--teal-dark)', marginBottom: 16 }}>
        {label}
      </p>
      {children}
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
      title:          title.trim(),
      slug:           slug.trim(),
      excerpt:        excerpt.trim() || null,
      hook:           hook.trim() || null,
      content:        content.trim(),
      author:         author.trim() || 'Kishore Ramesh Kumar',
      tags:           tags.split(',').map(t => t.trim()).filter(Boolean),
      status:         finalStatus,
      artifact_url:   artifactUrl.trim() || null,
      artifact_label: artifactUrl.trim() ? (artifactLabel.trim() || 'Download worksheet') : null,
      published_at:   finalStatus === 'published'
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
      <OpsPageHeader
        label="Blog"
        title={post ? 'Edit Post' : 'New Post'}
        actions={<OpsButton href="/ops/blog" variant="ghost">← Back to posts</OpsButton>}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <Section label="Metadata">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={LABEL}>Title *</label>
              <input type="text" value={title} onChange={(e) => handleTitleChange(e.target.value)}
                style={{ ...INPUT, fontSize: 16 }} placeholder="Post title" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={LABEL}>Slug *</label>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} style={INPUT} placeholder="post-slug" />
              </div>
              <div>
                <label style={LABEL}>Author</label>
                <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} style={INPUT} />
              </div>
            </div>

            <div>
              <label style={LABEL}>Tags (comma-separated)</label>
              <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} style={INPUT} placeholder="microbiome, research, ops" />
            </div>

            <div>
              <label style={LABEL}>Excerpt</label>
              <input type="text" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} style={INPUT}
                placeholder="One-line SEO description (optional)" />
              <p style={HINT}>Appears in search results and blog index cards. Not shown on post page.</p>
            </div>
          </div>
        </Section>

        <Section label="Public Hook">
          <label style={LABEL}>Hook — top of fold, always visible</label>
          <textarea value={hook} onChange={(e) => setHook(e.target.value)} rows={4}
            style={{ ...INPUT, resize: 'vertical', lineHeight: 1.7 }}
            placeholder="The compelling opener. 1–4 sentences that make someone stop scrolling." />
          <p style={HINT}>Displayed large at the top. Always visible — no gate.</p>
        </Section>

        <Section label="Substance">
          <label style={LABEL}>Substance — the framework body *</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={24}
            style={{ ...INPUT, resize: 'vertical', lineHeight: 1.7 }}
            placeholder="The full framework, analysis, or argument. Fully readable on the post page — no gate." />
          <p style={HINT}>The meat. Fully public — no email gate on this section.</p>
        </Section>

        <Section label="Gated Artifact">
          <OpsCard style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)', lineHeight: 1.6, margin: 0 }}>
              Optional. If provided, readers give their email to download this file. Appears as a call-to-action at the end of the post.
            </p>
            <div>
              <label style={LABEL}>Artifact URL (PDF, JPEG, or any file URL)</label>
              <input type="url" value={artifactUrl} onChange={(e) => setArtifactUrl(e.target.value)} style={INPUT}
                placeholder="https://... (Google Drive, Dropbox, S3, or direct link)" />
              <p style={HINT}>Upload the file externally and paste the public URL here.</p>
            </div>
            {artifactUrl && (
              <div>
                <label style={LABEL}>Download button label</label>
                <input type="text" value={artifactLabel} onChange={(e) => setArtifactLabel(e.target.value)} style={INPUT}
                  placeholder="Download worksheet" />
              </div>
            )}
          </OpsCard>
        </Section>

        <Section label="Publish">
          <div style={{ marginBottom: 16 }}>
            <span style={LABEL}>Status</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {['draft', 'published', 'archived'].map(s => {
                const on = status === s;
                return (
                  <button key={s} type="button" onClick={() => setStatus(s)} style={{
                    fontFamily:    'var(--font-mono)',
                    fontSize:      10,
                    fontWeight:    600,
                    letterSpacing: '0.5px',
                    padding:       '5px 14px',
                    borderRadius:  999,
                    border:        `1px solid ${on ? 'var(--teal)' : 'var(--border-mid)'}`,
                    background:    on ? 'var(--teal-soft)' : 'var(--surface)',
                    color:         on ? 'var(--teal-dark)' : 'var(--slate)',
                    cursor:        'pointer',
                  }}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <OpsAlert tone="err">{error}</OpsAlert>}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <OpsButton onClick={() => void save()} disabled={saving} variant="primary">
              {saving ? 'Saving…' : post ? 'Save changes' : 'Create draft'}
            </OpsButton>

            {status !== 'published' && (
              <OpsButton onClick={() => void save('published')} disabled={saving} variant="ghost">
                Publish →
              </OpsButton>
            )}

            {post && status !== 'published' && (
              <div style={{ marginLeft: 'auto' }}>
                {!confirmDelete ? (
                  <OpsButton onClick={() => setConfirmDelete(true)} variant="danger">
                    Delete draft
                  </OpsButton>
                ) : (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#b91c1c' }}>Are you sure?</span>
                    <OpsButton onClick={() => void handleDelete()} disabled={deleting} variant="danger">
                      {deleting ? 'Deleting…' : 'Yes, delete'}
                    </OpsButton>
                    <OpsButton onClick={() => setConfirmDelete(false)} variant="ghost">
                      Cancel
                    </OpsButton>
                  </div>
                )}
              </div>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}
