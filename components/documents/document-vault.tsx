'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import {
  DOC_TYPE_LABEL, DOC_CATEGORY, STATUS_LABEL, STATUS_COLORS,
  CLEARANCE_LABEL, REQUIRED_DOCS_BASE, REQUIRED_DOCS_WITH_SAMPLES,
  DOCUMENT_TYPES,
} from '@/lib/documents/types';
import type { StudyDocument, DocumentType, DocStatus } from '@/lib/documents/types';
import type { UserClearance } from '@/lib/documents/access';

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusChip({ status }: { status: DocStatus }) {
  const { bg, color } = STATUS_COLORS[status];
  return (
    <span style={{
      fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700,
      letterSpacing: '1.5px', textTransform: 'uppercase',
      background: bg, color, border: '1.5px solid var(--black)',
      padding: '2px 7px', whiteSpace: 'nowrap',
    }}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function ClearanceChip({ level }: { level: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    operator:    { bg: '#7c3aed', color: '#fff' },
    researcher:  { bg: 'var(--navy)', color: 'var(--white)' },
    participant: { bg: 'var(--amber)', color: 'var(--black)' },
    public:      { bg: 'var(--off-white)', color: 'var(--gray)' },
  };
  const { bg, color } = colors[level] ?? colors.public;
  return (
    <span style={{
      fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 600,
      letterSpacing: '1px', textTransform: 'uppercase',
      background: bg, color, border: '1.5px solid var(--black)',
      padding: '2px 6px', whiteSpace: 'nowrap',
    }}>
      {CLEARANCE_LABEL[level as keyof typeof CLEARANCE_LABEL] ?? level}
    </span>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({
  experimentId,
  userClearance,
  onClose,
  onUploaded,
}: {
  experimentId: string;
  userClearance: UserClearance;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const { user } = usePrivy();
  const [docType, setDocType]   = useState<DocumentType>('irb_approval');
  const [title, setTitle]       = useState('');
  const [desc, setDesc]         = useState('');
  const [file, setFile]         = useState<File | null>(null);
  const [reqSig, setReqSig]     = useState(false);
  const [sigDue, setSigDue]     = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  // Only show types available to this user
  const availableTypes = DOCUMENT_TYPES.filter(t => {
    if (userClearance === 'operator') return true;
    const uploaderRole = require('@/lib/documents/types').UPLOADER_ROLE[t];
    return uploaderRole === 'researcher' || uploaderRole === 'both';
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!file && !title) { setError('Title required'); return; }

    setSaving(true);
    setError('');

    try {
      let filePath: string | null = null;
      let fileName: string | null = null;
      let fileSize: number | null = null;
      let mimeType: string | null = null;

      if (file) {
        // Step 1: get signed upload URL
        const urlRes = await fetch(
          `/api/study/${experimentId}/documents/upload-url?type=${docType}&name=${encodeURIComponent(file.name)}`,
          { headers: { 'x-privy-did': user.id } },
        );
        const urlData = await urlRes.json() as { signedUrl?: string; filePath?: string; error?: string };
        if (!urlRes.ok || !urlData.signedUrl) {
          setError(urlData.error ?? 'Failed to get upload URL'); setSaving(false); return;
        }

        // Step 2: upload file directly to Supabase Storage
        const uploadRes = await fetch(urlData.signedUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });
        if (!uploadRes.ok) { setError('File upload failed'); setSaving(false); return; }

        filePath = urlData.filePath!;
        fileName = file.name;
        fileSize = file.size;
        mimeType = file.type;
      }

      // Step 3: create document record
      const res = await fetch(`/api/study/${experimentId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-privy-did': user.id },
        body: JSON.stringify({
          document_type: docType,
          title:         title || file?.name || DOC_TYPE_LABEL[docType],
          description:   desc || null,
          file_path:     filePath,
          file_name:     fileName,
          file_size_bytes: fileSize,
          mime_type:     mimeType,
          requires_signature: reqSig,
          signature_due_date: sigDue || null,
        }),
      });

      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setError(d.error ?? 'Upload failed');
      } else {
        onUploaded();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 16,
    }}>
      <div style={{
        background: 'var(--white)', border: '3px solid var(--black)',
        boxShadow: '6px 6px 0 var(--black)', width: '100%', maxWidth: 540,
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{
          padding: '16px 24px', borderBottom: '3px solid var(--black)',
          background: 'var(--off-white)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--black)' }}>
            Upload Document
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Document type */}
          <div>
            <label style={labelStyle}>Document Type</label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value as DocumentType)}
              style={inputStyle}
            >
              {availableTypes.map(t => (
                <option key={t} value={t}>{DOC_TYPE_LABEL[t]}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label style={labelStyle}>Title <span style={{ color: 'var(--gray)', fontWeight: 400 }}>(or leave blank to use filename)</span></label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={DOC_TYPE_LABEL[docType]}
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Notes / Description</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* File upload */}
          <div>
            <label style={labelStyle}>File <span style={{ color: 'var(--gray)', fontWeight: 400 }}>(PDF, DOC, DOCX, JPG, PNG — max 50 MB)</span></label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              style={{ ...inputStyle, padding: '6px 10px' }}
            />
          </div>

          {/* Requires signature */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => setReqSig(!reqSig)}
              style={{
                width: 48, height: 26, flexShrink: 0,
                background: reqSig ? 'var(--amber)' : 'var(--off-white)',
                border: '2px solid var(--black)', cursor: 'pointer', position: 'relative',
              }}
            >
              <div style={{
                width: 14, height: 14, background: 'var(--black)',
                position: 'absolute', top: 4, left: reqSig ? 26 : 4, transition: 'left 0.1s',
              }} />
            </button>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--black)' }}>
              Requires signature
            </span>
          </div>

          {reqSig && (
            <div>
              <label style={labelStyle}>Signature due by</label>
              <input type="date" value={sigDue} onChange={e => setSigDue(e.target.value)} style={inputStyle} />
            </div>
          )}

          {error && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
            <button type="submit" disabled={saving} className="btn-primary" style={{ opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Uploading...' : 'Upload →'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Sign Modal ───────────────────────────────────────────────────────────────

function SignModal({
  doc,
  experimentId,
  signerName,
  onClose,
  onSigned,
}: {
  doc: StudyDocument;
  experimentId: string;
  signerName: string;
  onClose: () => void;
  onSigned: () => void;
}) {
  const { user } = usePrivy();
  const [name, setName]   = useState(signerName);
  const [role, setRole]   = useState<'researcher' | 'sponsor' | 'operator'>('researcher');
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  async function handleSign() {
    if (!user || !agreed || !name.trim()) return;
    setSaving(true);
    setError('');
    const res = await fetch(`/api/study/${experimentId}/documents/${doc.id}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-privy-did': user.id },
      body: JSON.stringify({ signer_name: name, signer_role: role }),
    });
    if (!res.ok) {
      const d = await res.json() as { error?: string };
      setError(d.error ?? 'Sign failed');
    } else {
      onSigned();
    }
    setSaving(false);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 16,
    }}>
      <div style={{
        background: 'var(--white)', border: '3px solid var(--black)',
        boxShadow: '6px 6px 0 var(--black)', width: '100%', maxWidth: 480,
      }}>
        <div style={{
          padding: '16px 24px', borderBottom: '3px solid var(--black)',
          background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--white)' }}>
            Sign Document
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'white', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            background: 'var(--off-white)', border: '2px solid var(--black)', padding: 16,
          }}>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--black)', margin: '0 0 4px' }}>
              {doc.title}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--gray)', margin: 0 }}>
              {DOC_TYPE_LABEL[doc.document_type]} · Version {doc.version}
            </p>
          </div>

          <div>
            <label style={labelStyle}>Your full legal name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
              placeholder="Full name as it appears on legal documents"
            />
          </div>

          <div>
            <label style={labelStyle}>Signing as</label>
            <select value={role} onChange={e => setRole(e.target.value as typeof role)} style={inputStyle}>
              <option value="researcher">Principal Investigator / Researcher</option>
              <option value="sponsor">Sponsor Representative</option>
              <option value="operator">Biome Operations</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }}
            />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--black)', margin: 0, lineHeight: 1.5 }}>
              By clicking Sign, I confirm I have read this document in full and agree to be legally
              bound by its terms in my capacity as {role} for this study. Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}.
            </p>
          </div>

          {error && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleSign}
              disabled={!agreed || !name.trim() || saving}
              className="btn-primary"
              style={{ opacity: (!agreed || !name.trim() || saving) ? 0.4 : 1 }}
            >
              {saving ? 'Signing...' : 'Sign document →'}
            </button>
            <button onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Send for Signature Modal ─────────────────────────────────────────────────

function SendModal({
  doc,
  experimentId,
  onClose,
  onSent,
}: {
  doc: StudyDocument;
  experimentId: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const { user } = usePrivy();
  const [email, setEmail]     = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState('');

  async function handleSend() {
    if (!user || !email.trim()) return;
    setSending(true);
    setError('');
    const res = await fetch(`/api/study/${experimentId}/documents/${doc.id}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-privy-did': user.id },
      body: JSON.stringify({ to_email: email, message }),
    });
    if (!res.ok) {
      const d = await res.json() as { error?: string };
      setError(d.error ?? 'Send failed');
    } else {
      onSent();
    }
    setSending(false);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 16,
    }}>
      <div style={{
        background: 'var(--white)', border: '3px solid var(--black)',
        boxShadow: '6px 6px 0 var(--black)', width: '100%', maxWidth: 460,
      }}>
        <div style={{
          padding: '16px 24px', borderBottom: '3px solid var(--black)',
          background: 'var(--off-white)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>Send for Signature</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--black)', margin: 0 }}>
            Sending: <strong>{doc.title}</strong>
          </p>
          <div>
            <label style={labelStyle}>Recipient email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="researcher@institution.edu" />
          </div>
          <div>
            <label style={labelStyle}>Message (optional)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Please review and sign this agreement before the study launch." />
          </div>
          {error && <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleSend} disabled={!email.trim() || sending} className="btn-primary" style={{ opacity: (!email.trim() || sending) ? 0.4 : 1 }}>
              {sending ? 'Sending...' : 'Send →'}
            </button>
            <button onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Required docs checklist ─────────────────────────────────────────────────

function RequiredChecklist({ docs, hasSamples }: { docs: StudyDocument[]; hasSamples: boolean }) {
  const required = hasSamples ? REQUIRED_DOCS_WITH_SAMPLES : REQUIRED_DOCS_BASE;
  const presentTypes = new Set(docs.map(d => d.document_type));

  const missing = required.filter(t => !presentTypes.has(t));
  if (missing.length === 0) return null;

  return (
    <div style={{
      border: '3px solid var(--amber)', background: 'rgba(245,158,11,0.06)',
      padding: '14px 20px', marginBottom: 24,
    }}>
      <p style={{
        fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
        letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--black)',
        marginBottom: 10,
      }}>
        Required documents missing ({missing.length})
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {missing.map(t => (
          <span key={t} style={{
            fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600,
            background: 'var(--amber)', color: 'var(--black)',
            border: '1.5px solid var(--black)', padding: '3px 10px',
          }}>
            {DOC_TYPE_LABEL[t]}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const CATEGORIES = ['All', 'Regulatory', 'Protocol', 'Contracts', 'Consent', 'Compliance', 'Other'];

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--black)',
  background: 'var(--off-white)', border: '2px solid var(--black)',
  padding: '8px 12px', width: '100%', outline: 'none', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
  letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--black)', marginBottom: 6,
};

export function DocumentVault({
  experimentId,
  hasSamples = false,
  displayName,
}: {
  experimentId: string;
  hasSamples?: boolean;
  displayName?: string;
}) {
  const { user, ready } = usePrivy();
  const [docs, setDocs]       = useState<StudyDocument[]>([]);
  const [clearance, setClearance] = useState<UserClearance>('none');
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState('All');
  const [showUpload, setShowUpload] = useState(false);
  const [signDoc, setSignDoc]       = useState<StudyDocument | null>(null);
  const [sendDoc, setSendDoc]       = useState<StudyDocument | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [actionMsg, setActionMsg]   = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    const res = await fetch(`/api/study/${experimentId}/documents`, {
      headers: { 'x-privy-did': user.id },
    });
    if (res.ok) {
      const d = await res.json() as { documents: StudyDocument[]; clearance: UserClearance };
      setDocs(d.documents);
      setClearance(d.clearance);
    }
    setLoading(false);
  }, [user, experimentId]);

  useEffect(() => { if (ready) void load(); }, [ready, load]);

  async function handleDownload(doc: StudyDocument) {
    if (!user) return;
    setDownloading(doc.id);
    const res = await fetch(`/api/study/${experimentId}/documents/${doc.id}`, {
      headers: { 'x-privy-did': user.id },
    });
    const d = await res.json() as { downloadUrl?: string; error?: string };
    if (d.downloadUrl) {
      window.open(d.downloadUrl, '_blank');
    } else {
      alert(d.error ?? 'Download failed');
    }
    setDownloading(null);
  }

  async function handleStatusChange(docId: string, newStatus: string) {
    if (!user) return;
    const res = await fetch(`/api/study/${experimentId}/documents/${docId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-privy-did': user.id },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      await load();
      setActionMsg(newStatus === 'approved' ? 'Document approved' : 'Status updated');
      setTimeout(() => setActionMsg(''), 3000);
    }
  }

  async function handleDelete(docId: string) {
    if (!user || !confirm('Delete this document?')) return;
    await fetch(`/api/study/${experimentId}/documents/${docId}`, {
      method: 'DELETE',
      headers: { 'x-privy-did': user.id },
    });
    await load();
  }

  const filtered = category === 'All'
    ? docs
    : docs.filter(d => DOC_CATEGORY[d.document_type] === category);

  const userIsSigned = (doc: StudyDocument) =>
    doc.signatures?.some(s => s.signer_user_id === user?.id) ?? false;

  if (!ready || loading) return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--gray)' }}>
      Loading documents...
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--black)', margin: 0 }}>
            Document Vault
          </h3>
          {displayName && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--gray)', margin: '4px 0 0' }}>
              {displayName}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {actionMsg && (
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600,
              background: 'var(--black)', color: 'var(--amber)',
              border: '1.5px solid var(--black)', padding: '4px 10px',
            }}>
              ✓ {actionMsg}
            </span>
          )}
          {(clearance === 'researcher' || clearance === 'operator') && (
            <button onClick={() => setShowUpload(true)} className="btn-primary" style={{ fontSize: 13 }}>
              + Upload Document
            </button>
          )}
        </div>
      </div>

      {/* Required docs checklist */}
      <RequiredChecklist docs={docs} hasSamples={hasSamples} />

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '3px solid var(--black)', marginBottom: 24, flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => {
          const count = cat === 'All' ? docs.length : docs.filter(d => DOC_CATEGORY[d.document_type] === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600,
                letterSpacing: '1px', textTransform: 'uppercase',
                padding: '10px 16px', border: 'none', borderBottom: category === cat ? '3px solid var(--black)' : '3px solid transparent',
                background: category === cat ? 'var(--amber)' : 'transparent',
                color: 'var(--black)', cursor: 'pointer', marginBottom: -3,
              }}
            >
              {cat} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Document list */}
      {filtered.length === 0 ? (
        <div style={{
          border: '3px solid var(--black)', padding: '48px 24px', textAlign: 'center',
          background: 'var(--off-white)',
        }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--black)', margin: '0 0 8px' }}>
            No documents yet
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--gray)', margin: 0 }}>
            {clearance === 'researcher' || clearance === 'operator'
              ? 'Upload your first document using the button above.'
              : 'Documents will appear here once uploaded.'}
          </p>
        </div>
      ) : (
        <div style={{ border: '3px solid var(--black)', boxShadow: '4px 4px 0 var(--black)', background: 'var(--white)' }}>
          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 130px 140px 100px auto',
            padding: '10px 20px', borderBottom: '2px solid var(--black)',
            background: 'var(--off-white)',
          }}>
            {['Document', 'Status', 'Type', 'Access', 'Actions'].map(h => (
              <span key={h} style={{
                fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700,
                letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gray)',
              }}>{h}</span>
            ))}
          </div>

          {filtered.map((doc, i) => {
            const hasSig    = userIsSigned(doc);
            const canSign   = doc.requires_signature && !hasSig &&
                              (clearance === 'researcher' || clearance === 'operator') &&
                              (doc.status === 'pending_signature' || doc.status === 'signed');
            const canSend   = clearance === 'operator' && doc.file_path;
            const canApprove = clearance === 'operator' && doc.status === 'pending_review';
            const canReject = clearance === 'operator' && doc.status === 'pending_review';
            const canSubmit = clearance === 'researcher' && doc.status === 'draft' && doc.uploaded_by === user?.id;
            const canDel    = clearance === 'operator' || (doc.status === 'draft' && doc.uploaded_by === user?.id);

            return (
              <div
                key={doc.id}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 130px 140px 100px auto',
                  padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                  alignItems: 'center', gap: 8,
                }}
              >
                {/* Document info */}
                <div style={{ overflow: 'hidden', paddingRight: 12 }}>
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: 'var(--black)',
                    margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {doc.title}
                  </p>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    {doc.file_name && (
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--gray)' }}>
                        {doc.file_name}
                      </span>
                    )}
                    {doc.version > 1 && (
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 600, color: 'var(--gray)' }}>
                        v{doc.version}
                      </span>
                    )}
                    {doc.signatures && doc.signatures.length > 0 && (
                      <span style={{
                        fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 600,
                        background: 'var(--black)', color: 'var(--amber)', border: '1px solid var(--black)',
                        padding: '1px 5px',
                      }}>
                        {doc.signatures.length} sig{doc.signatures.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {doc.signature_due_date && doc.status === 'pending_signature' && (
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#ef4444' }}>
                        Due {new Date(doc.signature_due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div><StatusChip status={doc.status as DocStatus} /></div>

                {/* Type */}
                <div>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 600,
                    letterSpacing: '0.5px', textTransform: 'uppercase',
                    color: 'var(--gray)', background: 'var(--off-white)',
                    border: '1.5px solid var(--black)', padding: '2px 6px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    display: 'block', maxWidth: 130,
                  }}>
                    {DOC_CATEGORY[doc.document_type]}
                  </span>
                </div>

                {/* Clearance */}
                <div><ClearanceChip level={doc.clearance_level} /></div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {doc.file_path && (
                    <button
                      onClick={() => handleDownload(doc)}
                      disabled={downloading === doc.id}
                      style={actionBtnStyle}
                      title="Download"
                    >
                      {downloading === doc.id ? '...' : '↓'}
                    </button>
                  )}
                  {canSubmit && (
                    <button onClick={() => handleStatusChange(doc.id, 'pending_review')} style={{ ...actionBtnStyle, background: 'var(--amber)' }} title="Submit for review">
                      Submit
                    </button>
                  )}
                  {canSign && (
                    <button onClick={() => setSignDoc(doc)} style={{ ...actionBtnStyle, background: 'var(--navy)', color: 'white' }} title="Sign">
                      Sign
                    </button>
                  )}
                  {canSend && (
                    <button onClick={() => setSendDoc(doc)} style={actionBtnStyle} title="Send for signature">
                      Send
                    </button>
                  )}
                  {canApprove && (
                    <button onClick={() => handleStatusChange(doc.id, 'approved')} style={{ ...actionBtnStyle, background: 'var(--black)', color: 'var(--amber)' }} title="Approve">
                      ✓
                    </button>
                  )}
                  {canReject && (
                    <button onClick={() => handleStatusChange(doc.id, 'rejected')} style={{ ...actionBtnStyle, background: '#ef4444', color: 'white' }} title="Reject">
                      ✗
                    </button>
                  )}
                  {canDel && (
                    <button onClick={() => handleDelete(doc.id)} style={{ ...actionBtnStyle, color: '#ef4444' }} title="Delete">
                      ×
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showUpload && (
        <UploadModal
          experimentId={experimentId}
          userClearance={clearance}
          onClose={() => setShowUpload(false)}
          onUploaded={() => { setShowUpload(false); void load(); setActionMsg('Document uploaded'); setTimeout(() => setActionMsg(''), 3000); }}
        />
      )}
      {signDoc && (
        <SignModal
          doc={signDoc}
          experimentId={experimentId}
          signerName={user?.email?.address ?? ''}
          onClose={() => setSignDoc(null)}
          onSigned={() => { setSignDoc(null); void load(); setActionMsg('Document signed'); setTimeout(() => setActionMsg(''), 3000); }}
        />
      )}
      {sendDoc && (
        <SendModal
          doc={sendDoc}
          experimentId={experimentId}
          onClose={() => setSendDoc(null)}
          onSent={() => { setSendDoc(null); void load(); setActionMsg('Signature request sent'); setTimeout(() => setActionMsg(''), 3000); }}
        />
      )}
    </div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
  background: 'var(--off-white)', color: 'var(--black)',
  border: '2px solid var(--black)', padding: '4px 8px', cursor: 'pointer',
  whiteSpace: 'nowrap',
};
