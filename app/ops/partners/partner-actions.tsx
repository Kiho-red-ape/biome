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
  const [status,   setStatus]   = useState(currentStatus);
  const [homepage, setHomepage] = useState(displayOnHomepage);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

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
              fontFamily:    'var(--font-mono)',
              fontSize:      11,
              fontWeight:    600,
              letterSpacing: '0.5px',
              padding:       '6px 14px',
              background:    'var(--teal)',
              border:        '1px solid var(--teal)',
              color:         '#fff',
              cursor:        'pointer',
              borderRadius:  'var(--radius-sm)',
            }}
          >
            Approve
          </button>
          <button
            onClick={() => { setStatus('rejected'); void update({ status: 'rejected' }); }}
            disabled={saving}
            style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      11,
              fontWeight:    600,
              letterSpacing: '0.5px',
              padding:       '6px 14px',
              background:    'var(--surface)',
              border:        '1px solid var(--border-mid)',
              color:         'var(--slate)',
              cursor:        'pointer',
              borderRadius:  'var(--radius-sm)',
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
              width:          16,
              height:         16,
              background:     homepage ? 'var(--teal)' : 'var(--surface)',
              border:         `1px solid ${homepage ? 'var(--teal)' : 'var(--border-mid)'}`,
              borderRadius:   4,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              cursor:         'pointer',
              flexShrink:     0,
            }}
          >
            {homepage && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900, lineHeight: 1 }}>✓</span>}
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)' }}>
            Show on homepage
          </span>
        </label>
      )}

      {saved && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#15803d' }}>✓ Saved</span>
      )}
    </div>
  );
}
