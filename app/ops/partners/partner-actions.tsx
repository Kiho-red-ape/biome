'use client';

import { useState } from 'react';

export function PartnerActions({
  partnerId,
  currentStatus,
  displayOnHomepage,
}: {
  partnerId: string;
  currentStatus: string;
  displayOnHomepage: boolean;
}) {
  const [status,  setStatus]  = useState(currentStatus);
  const [homepage, setHomepage] = useState(displayOnHomepage);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  async function update(patch: Record<string, unknown>) {
    setSaving(true);
    await fetch('/api/ops/partners', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: partnerId, ...patch }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      {status === 'pending' && (
        <>
          <button
            onClick={() => { setStatus('approved'); void update({ status: 'approved' }); }}
            disabled={saving}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, padding: '5px 12px',
              background: 'rgba(183,255,97,0.08)', border: '1px solid rgba(183,255,97,0.25)',
              color: '#b7ff61', cursor: 'pointer', borderRadius: 2, textTransform: 'uppercase', letterSpacing: '1px',
            }}
          >
            Approve
          </button>
          <button
            onClick={() => { setStatus('rejected'); void update({ status: 'rejected' }); }}
            disabled={saving}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, padding: '5px 12px',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
              color: '#5b8a9a', cursor: 'pointer', borderRadius: 2, textTransform: 'uppercase', letterSpacing: '1px',
            }}
          >
            Reject
          </button>
        </>
      )}

      {status === 'approved' && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <div
            onClick={() => { const next = !homepage; setHomepage(next); void update({ display_on_homepage: next }); }}
            style={{
              width: 14, height: 14,
              background: homepage ? '#b7ff61' : 'transparent',
              border: `1px solid ${homepage ? '#b7ff61' : 'rgba(255,255,255,0.15)'}`,
              borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {homepage && <span style={{ color: '#050709', fontSize: 9, fontWeight: 900 }}>✓</span>}
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#aab8b1' }}>
            Show on homepage
          </span>
        </label>
      )}

      {saved && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#b7ff61' }}>✓ Saved</span>
      )}
    </div>
  );
}
