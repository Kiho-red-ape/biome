'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80);
}

const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)' };
const heading: React.CSSProperties = { fontFamily: 'var(--font-heading)' };

const fieldLabel = (text: string, sub?: string): React.ReactNode => (
  <div style={{ marginBottom: 8 }}>
    <p style={{ ...mono, fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--green)', marginBottom: 2 }}>{text}</p>
    {sub && <p style={{ ...mono, fontSize: 10, color: '#4a7055' }}>{sub}</p>}
  </div>
);

const inputStyle: React.CSSProperties = {
  ...mono, fontSize: 13, color: 'var(--text-bright)',
  background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.15)',
  borderRadius: 3, padding: '10px 14px', width: '100%', boxSizing: 'border-box',
  outline: 'none', resize: 'vertical',
};

const textareaStyle = (rows: number): React.CSSProperties => ({
  ...inputStyle, resize: 'vertical', minHeight: rows * 22,
});

export default function WritePage() {
  const router = useRouter();
  const { user, ready, authenticated } = usePrivy();

  const [title,               setTitle]             = useState('');
  const [slug,                setSlug]              = useState('');
  const [slugEdited,          setSlugEdited]        = useState(false);
  const [hook,                setHook]              = useState('');
  const [content,             setContent]           = useState('');
  const [artifactUrl,         setArtifactUrl]       = useState('');
  const [artifactLabel,       setArtifactLabel]     = useState('');
  const [artifactType,        setArtifactType]      = useState<'pdf' | 'image' | ''>('');
  const [tags,                setTags]              = useState('');
  const [saving,              setSaving]            = useState(false);
  const [error,               setError]             = useState('');
  const [uploadProgress,      setUploadProgress]    = useState(false);

  if (!ready) return null;
  if (!authenticated) { router.replace('/'); return null; }

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!slugEdited) setSlug(slugify(val));
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadProgress(true);
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('privyDid', user.id);

    const res  = await fetch('/api/blog/upload', { method: 'POST', body: fd });
    const data = await res.json() as { url?: string; type?: string; error?: string };
    setUploadProgress(false);

    if (!res.ok || data.error) { setError(data.error ?? 'Upload failed'); return; }
    setArtifactUrl(data.url ?? '');
    if (data.type) setArtifactType(data.type as 'pdf' | 'image');
    if (!artifactLabel) setArtifactLabel(file.name.replace(/\.[^.]+$/, '').replace(/-/g, ' '));
  }

  async function save(status: 'draft' | 'published') {
    if (!user) return;
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!slug.trim())  { setError('Slug is required.'); return; }
    setError('');
    setSaving(true);

    const tagArr = tags.split(',').map(t => t.trim()).filter(Boolean);

    const res  = await fetch('/api/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorId:           user.id,
        title:              title.trim(),
        slug:               slug.trim(),
        hook:               hook.trim(),
        content:            content.trim(),
        gatedArtifactUrl:   artifactUrl  || null,
        gatedArtifactLabel: artifactLabel || null,
        gatedArtifactType:  artifactType  || null,
        tags:               tagArr,
        status,
      }),
    });
    const data = await res.json() as { post?: { id: string }; error?: unknown };
    setSaving(false);

    if (!res.ok) { setError(typeof data.error === 'string' ? data.error : 'Save failed. Check slug is unique.'); return; }
    router.push('/blog/drafts');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Top nav */}
      <div style={{
        borderBottom: '1px solid rgba(77,255,128,0.07)',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <Link href="/blog/drafts" style={{ ...mono, fontSize: 10, letterSpacing: '2px', color: '#4a7055', textDecoration: 'none' }}>
          ← DRAFTS
        </Link>
        <span style={{ color: 'rgba(77,255,128,0.15)' }}>|</span>
        <span style={{ ...mono, fontSize: 10, letterSpacing: '2px', color: '#4a7055' }}>NEW POST</span>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6" style={{ paddingTop: 44, paddingBottom: 80 }}>

        <p style={{ ...mono, fontSize: 9, letterSpacing: '3px', color: 'var(--green)', marginBottom: 10 }}>// WRITE</p>
        <h1 style={{ ...heading, fontSize: 28, fontWeight: 800, color: 'var(--text-white)', marginBottom: 32 }}>
          New post
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Title */}
          <div>
            {fieldLabel('Title')}
            <input
              type="text" value={title} onChange={e => handleTitleChange(e.target.value)}
              placeholder="Your post title"
              style={{ ...inputStyle, fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-heading)' }}
            />
          </div>

          {/* Slug */}
          <div>
            {fieldLabel('URL slug', 'biome.to/blog/[slug] — lowercase, hyphens only')}
            <input
              type="text" value={slug}
              onChange={e => { setSlugEdited(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); }}
              placeholder="your-post-slug"
              style={inputStyle}
            />
          </div>

          {/* HOOK */}
          <div style={{
            background: 'rgba(77,255,128,0.03)',
            border: '1px solid rgba(77,255,128,0.12)',
            borderLeft: '3px solid var(--green)',
            borderRadius: 3, padding: '18px 18px 22px',
          }}>
            {fieldLabel('// PUBLIC HOOK', 'Always visible · top of fold · the reason someone reads on')}
            <textarea
              value={hook}
              onChange={e => setHook(e.target.value)}
              placeholder="The compelling opening — 2–4 sentences. This is what shows on the listing page and above the fold on the post page. Make it pull people in."
              style={textareaStyle(6)}
              rows={6}
            />
          </div>

          {/* SUBSTANCE */}
          <div style={{
            background: 'rgba(0,229,255,0.02)',
            border: '1px solid rgba(0,229,255,0.10)',
            borderLeft: '3px solid var(--cyan)',
            borderRadius: 3, padding: '18px 18px 22px',
          }}>
            {fieldLabel('// SUBSTANCE', 'Full article body · always visible on the post page · the actual value')}
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="The full article. This is the meat — frameworks, data, insights, analysis. Use line breaks for readability. Supports plain text."
              style={textareaStyle(18)}
              rows={18}
            />
          </div>

          {/* GATED ARTIFACT */}
          <div style={{
            background: 'rgba(255,179,0,0.03)',
            border: '1px solid rgba(255,179,0,0.15)',
            borderLeft: '3px solid #ffb300',
            borderRadius: 3, padding: '18px 18px 22px',
          }}>
            {fieldLabel('// GATED ARTIFACT', 'Optional · PDF or image · unlocked when reader gives their email')}

            {/* Upload */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ ...mono, fontSize: 10, color: '#4a7055', marginBottom: 8 }}>UPLOAD FILE (.pdf, .jpg, .png — max 10 MB)</p>
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                ...mono, fontSize: 11, letterSpacing: '1px',
                background: 'rgba(255,179,0,0.08)',
                border: '1px solid rgba(255,179,0,0.25)',
                borderRadius: 3, padding: '9px 16px',
                cursor: 'pointer', color: '#ffb300',
              }}>
                {uploadProgress ? 'Uploading...' : '↑ Choose file'}
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploadProgress} />
              </label>
            </div>

            {/* OR URL */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ ...mono, fontSize: 10, color: '#4a7055', marginBottom: 8 }}>OR PASTE URL</p>
              <input
                type="url" value={artifactUrl}
                onChange={e => setArtifactUrl(e.target.value)}
                placeholder="https://..."
                style={inputStyle}
              />
            </div>

            {/* Type */}
            {artifactUrl && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ ...mono, fontSize: 10, color: '#4a7055', marginBottom: 8 }}>TYPE</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['pdf', 'image'] as const).map(t => (
                    <button
                      key={t} type="button"
                      onClick={() => setArtifactType(t)}
                      style={{
                        ...mono, fontSize: 11, padding: '7px 14px',
                        background: artifactType === t ? 'rgba(255,179,0,0.15)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${artifactType === t ? 'rgba(255,179,0,0.4)' : 'rgba(255,179,0,0.15)'}`,
                        borderRadius: 3, cursor: 'pointer',
                        color: artifactType === t ? '#ffb300' : '#4a7055',
                      }}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Label */}
            <div>
              <p style={{ ...mono, fontSize: 10, color: '#4a7055', marginBottom: 8 }}>DOWNLOAD LABEL</p>
              <input
                type="text" value={artifactLabel}
                onChange={e => setArtifactLabel(e.target.value)}
                placeholder="e.g. Download the study planning worksheet"
                style={inputStyle}
              />
            </div>

            {artifactUrl && (
              <p style={{ ...mono, fontSize: 10, color: '#ffb300', marginTop: 12 }}>
                ✓ Artifact set — readers will enter their email to unlock this download
              </p>
            )}
          </div>

          {/* Tags */}
          <div>
            {fieldLabel('Tags', 'Comma-separated, optional')}
            <input
              type="text" value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="research, sleep, microbiome"
              style={inputStyle}
            />
          </div>

          {/* Error */}
          {error && (
            <p style={{ ...mono, fontSize: 12, color: '#ff6b6b' }}>{error}</p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => save('draft')}
              disabled={saving}
              style={{
                ...mono, fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase',
                background: 'transparent', color: 'var(--text)',
                border: '1px solid rgba(77,255,128,0.25)',
                borderRadius: 3, padding: '12px 22px', cursor: 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Save draft'}
            </button>
            <button
              onClick={() => save('published')}
              disabled={saving}
              style={{
                ...mono, fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase',
                background: 'var(--green)', color: '#070c07',
                border: 'none', borderRadius: 3, padding: '12px 22px',
                cursor: 'pointer', fontWeight: 700,
              }}
            >
              {saving ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
