'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';

const mono: React.CSSProperties    = { fontFamily: 'var(--font-mono)' };
const heading: React.CSSProperties = { fontFamily: 'var(--font-heading)' };

const inputStyle: React.CSSProperties = {
  ...mono, fontSize: 13, color: 'var(--text-bright)',
  background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.15)',
  borderRadius: 3, padding: '10px 14px', width: '100%', boxSizing: 'border-box',
  outline: 'none',
};

const textareaStyle = (rows: number): React.CSSProperties => ({
  ...inputStyle, resize: 'vertical', minHeight: rows * 22,
});

type Post = {
  id: string; author_id: string; title: string; slug: string;
  hook: string; content: string;
  gated_artifact_url: string | null; gated_artifact_label: string | null;
  gated_artifact_type: 'pdf' | 'image' | null;
  tags: string[]; status: 'draft' | 'published';
};

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, ready, authenticated } = usePrivy();

  const [post,          setPost]         = useState<Post | null>(null);
  const [loading,       setLoading]      = useState(true);
  const [title,         setTitle]        = useState('');
  const [slug,          setSlug]         = useState('');
  const [hook,          setHook]         = useState('');
  const [content,       setContent]      = useState('');
  const [artifactUrl,   setArtifactUrl]  = useState('');
  const [artifactLabel, setArtifactLabel]= useState('');
  const [artifactType,  setArtifactType] = useState<'pdf' | 'image' | ''>('');
  const [tags,          setTags]         = useState('');
  const [saving,        setSaving]       = useState(false);
  const [error,         setError]        = useState('');
  const [uploadProgress, setUploadProgress] = useState(false);

  useEffect(() => {
    if (!ready || !authenticated) return;
    fetch(`/api/blog/${id}`)
      .then(r => r.json())
      .then((d: { post?: Post }) => {
        const p = d.post;
        if (!p) { router.replace('/blog/drafts'); return; }
        if (p.author_id !== user?.id) { router.replace('/blog/drafts'); return; }
        setPost(p);
        setTitle(p.title);
        setSlug(p.slug);
        setHook(p.hook);
        setContent(p.content);
        setArtifactUrl(p.gated_artifact_url ?? '');
        setArtifactLabel(p.gated_artifact_label ?? '');
        setArtifactType(p.gated_artifact_type ?? '');
        setTags(p.tags.join(', '));
      })
      .finally(() => setLoading(false));
  }, [ready, authenticated, id, user?.id, router]);

  if (!ready || loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ ...mono, fontSize: 11, color: '#4a7055' }}>Loading...</p>
    </div>
  );

  if (!authenticated) { router.replace('/'); return null; }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadProgress(true); setError('');
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
    if (!user || !post) return;
    if (!title.trim()) { setError('Title is required.'); return; }
    setError(''); setSaving(true);
    const tagArr = tags.split(',').map(t => t.trim()).filter(Boolean);
    const res = await fetch(`/api/blog/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        privyDid: user.id, title: title.trim(), slug: slug.trim(),
        hook: hook.trim(), content: content.trim(),
        gatedArtifactUrl:   artifactUrl  || null,
        gatedArtifactLabel: artifactLabel || null,
        gatedArtifactType:  artifactType  || null,
        tags: tagArr, status,
      }),
    });
    const data = await res.json() as { error?: unknown };
    setSaving(false);
    if (!res.ok) { setError(typeof data.error === 'string' ? data.error : 'Save failed.'); return; }
    router.push('/blog/drafts');
  }

  const sectionBox = (color: string, borderColor: string, title: string, sub: string, children: React.ReactNode) => (
    <div style={{
      background: color, border: `1px solid ${borderColor}`,
      borderLeft: `3px solid ${borderColor.replace('0.10', '1').replace('0.12', '1').replace('0.15', '1')}`,
      borderRadius: 3, padding: '18px 18px 22px',
    }}>
      <div style={{ marginBottom: 8 }}>
        <p style={{ ...mono, fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: borderColor.includes('229') ? 'var(--cyan)' : borderColor.includes('179') ? '#ffb300' : 'var(--green)', marginBottom: 2 }}>{title}</p>
        <p style={{ ...mono, fontSize: 10, color: '#4a7055' }}>{sub}</p>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ borderBottom: '1px solid rgba(77,255,128,0.07)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/blog/drafts" style={{ ...mono, fontSize: 10, letterSpacing: '2px', color: '#4a7055', textDecoration: 'none' }}>← DRAFTS</Link>
        <span style={{ color: 'rgba(77,255,128,0.15)' }}>|</span>
        <span style={{ ...mono, fontSize: 10, color: '#4a7055', letterSpacing: '2px' }}>EDITING: {post?.title}</span>
        {post?.status === 'published' && (
          <span style={{ ...mono, fontSize: 9, color: 'var(--green)', letterSpacing: '2px', marginLeft: 'auto' }}>PUBLISHED</span>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6" style={{ paddingTop: 44, paddingBottom: 80 }}>
        <p style={{ ...mono, fontSize: 9, letterSpacing: '3px', color: 'var(--green)', marginBottom: 10 }}>// EDIT</p>
        <h1 style={{ ...heading, fontSize: 28, fontWeight: 800, color: 'var(--text-white)', marginBottom: 32 }}>Edit post</h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          <div>
            <p style={{ ...mono, fontSize: 9, letterSpacing: '2px', color: 'var(--green)', marginBottom: 6, textTransform: 'uppercase' }}>Title</p>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={{ ...inputStyle, fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-heading)' }} />
          </div>

          <div>
            <p style={{ ...mono, fontSize: 9, letterSpacing: '2px', color: 'var(--green)', marginBottom: 4, textTransform: 'uppercase' }}>URL slug</p>
            <p style={{ ...mono, fontSize: 10, color: '#4a7055', marginBottom: 6 }}>biome.to/blog/[slug]</p>
            <input type="text" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} style={inputStyle} />
          </div>

          {sectionBox('rgba(77,255,128,0.03)', 'rgba(77,255,128,0.12)', '// PUBLIC HOOK', 'Always visible · top of fold · the reason someone reads on', (
            <textarea value={hook} onChange={e => setHook(e.target.value)} rows={6} style={textareaStyle(6)} placeholder="Compelling opening — always public" />
          ))}

          {sectionBox('rgba(0,229,255,0.02)', 'rgba(0,229,255,0.10)', '// SUBSTANCE', 'Full article body · always visible · the actual value', (
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={18} style={textareaStyle(18)} placeholder="Full article body..." />
          ))}

          {/* Gated artifact */}
          <div style={{ background: 'rgba(255,179,0,0.03)', border: '1px solid rgba(255,179,0,0.15)', borderLeft: '3px solid #ffb300', borderRadius: 3, padding: '18px 18px 22px' }}>
            <p style={{ ...mono, fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: '#ffb300', marginBottom: 2 }}>// GATED ARTIFACT</p>
            <p style={{ ...mono, fontSize: 10, color: '#4a7055', marginBottom: 14 }}>Optional · PDF or image · unlocked when reader gives their email</p>

            <div style={{ marginBottom: 14 }}>
              <p style={{ ...mono, fontSize: 10, color: '#4a7055', marginBottom: 6 }}>UPLOAD FILE (.pdf, .jpg, .png — max 10 MB)</p>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, ...mono, fontSize: 11, letterSpacing: '1px', background: 'rgba(255,179,0,0.08)', border: '1px solid rgba(255,179,0,0.25)', borderRadius: 3, padding: '9px 16px', cursor: 'pointer', color: '#ffb300' }}>
                {uploadProgress ? 'Uploading...' : '↑ Replace file'}
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploadProgress} />
              </label>
            </div>

            <div style={{ marginBottom: 14 }}>
              <p style={{ ...mono, fontSize: 10, color: '#4a7055', marginBottom: 6 }}>OR PASTE URL</p>
              <input type="url" value={artifactUrl} onChange={e => setArtifactUrl(e.target.value)} placeholder="https://..." style={inputStyle} />
            </div>

            {artifactUrl && (
              <div style={{ marginBottom: 14, display: 'flex', gap: 8 }}>
                {(['pdf', 'image'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setArtifactType(t)} style={{ ...mono, fontSize: 11, padding: '7px 14px', background: artifactType === t ? 'rgba(255,179,0,0.15)' : 'rgba(255,255,255,0.02)', border: `1px solid ${artifactType === t ? 'rgba(255,179,0,0.4)' : 'rgba(255,179,0,0.15)'}`, borderRadius: 3, cursor: 'pointer', color: artifactType === t ? '#ffb300' : '#4a7055' }}>{t.toUpperCase()}</button>
                ))}
              </div>
            )}

            <div>
              <p style={{ ...mono, fontSize: 10, color: '#4a7055', marginBottom: 6 }}>DOWNLOAD LABEL</p>
              <input type="text" value={artifactLabel} onChange={e => setArtifactLabel(e.target.value)} placeholder="e.g. Download the study planning worksheet" style={inputStyle} />
            </div>

            {artifactUrl && <p style={{ ...mono, fontSize: 10, color: '#ffb300', marginTop: 10 }}>✓ Artifact set — readers enter email to unlock download</p>}
          </div>

          <div>
            <p style={{ ...mono, fontSize: 9, letterSpacing: '2px', color: 'var(--green)', marginBottom: 4, textTransform: 'uppercase' }}>Tags</p>
            <p style={{ ...mono, fontSize: 10, color: '#4a7055', marginBottom: 6 }}>Comma-separated, optional</p>
            <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="research, sleep, microbiome" style={inputStyle} />
          </div>

          {error && <p style={{ ...mono, fontSize: 12, color: '#ff6b6b' }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => save('draft')} disabled={saving} style={{ ...mono, fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', background: 'transparent', color: 'var(--text)', border: '1px solid rgba(77,255,128,0.25)', borderRadius: 3, padding: '12px 22px', cursor: 'pointer' }}>
              {saving ? 'Saving...' : 'Save draft'}
            </button>
            <button onClick={() => save('published')} disabled={saving} style={{ ...mono, fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', background: 'var(--green)', color: '#070c07', border: 'none', borderRadius: 3, padding: '12px 22px', cursor: 'pointer', fontWeight: 700 }}>
              {saving ? 'Publishing...' : post?.status === 'published' ? 'Update' : 'Publish'}
            </button>
            {post?.status === 'published' && (
              <Link href={`/blog/${post.slug}`} style={{ ...mono, fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--cyan)', textDecoration: 'none', padding: '12px 0', display: 'inline-flex', alignItems: 'center' }}>
                View live →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
