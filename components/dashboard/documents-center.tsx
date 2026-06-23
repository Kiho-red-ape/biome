'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashCard, CardLabel } from './card';
import { DOC_TYPE_LABEL, type DocumentType } from '@/lib/documents/types';
import type { DocumentStudyGroup, ParticipantDoc } from '@/lib/dashboard/tasks';

function docTypeLabel(t: string): string {
  return DOC_TYPE_LABEL[t as DocumentType] ?? 'Document';
}

function DocRow({ doc, privyDid }: { doc: ParticipantDoc; privyDid: string }) {
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState(false);

  async function download() {
    if (!doc.fileName) return; // no file to download
    setBusy(true);
    setErr(false);
    try {
      const res = await fetch(`/api/study/${doc.experimentId}/documents/${doc.id}`, {
        headers: { 'x-privy-did': privyDid },
      });
      const data = (await res.json()) as { downloadUrl?: string | null };
      if (data.downloadUrl) window.open(data.downloadUrl, '_blank', 'noopener,noreferrer');
      else setErr(true);
    } catch {
      setErr(true);
    } finally {
      setBusy(false);
    }
  }

  const needsSign = doc.requiresSignature && !doc.signedByMe;

  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      gap:            12,
      padding:        '12px 16px',
      border:         '1px solid var(--border-soft)',
      borderRadius:   'var(--radius-sm)',
      background:     'var(--surface)',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {doc.title}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
          {docTypeLabel(doc.documentType)}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {needsSign ? (
          <>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '1px',
              textTransform: 'uppercase', color: 'var(--teal-dark)', background: 'var(--teal-soft)',
              borderRadius: 4, padding: '3px 8px',
            }}>
              Sign required
            </span>
            <Link href={`/experiments/${doc.experimentId}`} style={{
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#fff',
              background: 'var(--teal)', borderRadius: 'var(--radius-sm)', padding: '6px 12px',
              textDecoration: 'none',
            }}>
              Review →
            </Link>
          </>
        ) : (
          <button
            onClick={() => void download()}
            disabled={busy || !doc.fileName}
            style={{
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
              color: doc.fileName ? 'var(--teal-dark)' : 'var(--muted)',
              background: 'var(--surface)', border: '1px solid var(--border-mid)',
              borderRadius: 'var(--radius-sm)', padding: '6px 12px',
              cursor: busy || !doc.fileName ? 'default' : 'pointer', opacity: busy ? 0.5 : 1,
            }}
          >
            {busy ? '…' : err ? 'Retry' : doc.fileName ? 'Download' : 'No file'}
          </button>
        )}
      </div>
    </div>
  );
}

export function DocumentsCenter({ privyDid, filterStudyId }: { privyDid: string; filterStudyId?: string }) {
  const [studies, setStudies] = useState<DocumentStudyGroup[] | null>(null);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/dashboard/documents?privyDid=${encodeURIComponent(privyDid)}`)
      .then((r) => r.json())
      .then((d: { studies?: DocumentStudyGroup[] }) => { if (active) setStudies(d.studies ?? []); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [privyDid]);

  if (error || !studies) return null;

  const visible = filterStudyId
    ? studies.filter((s) => s.studyId === filterStudyId)
    : studies;

  if (visible.length === 0) return null;

  return (
    <DashCard>
      <CardLabel>Documents</CardLabel>
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {visible.map((s) => (
          <div key={s.studyId}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1.5px',
              textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10,
            }}>
              {s.studyTitle}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {s.documents.map((doc) => (
                <DocRow key={doc.id} doc={doc} privyDid={privyDid} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashCard>
  );
}
