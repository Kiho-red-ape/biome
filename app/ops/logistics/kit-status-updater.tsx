'use client';

import { useState } from 'react';

const SHIP_STATUSES    = ['pending', 'shipped', 'delivered', 'returned_undeliverable'] as const;
const COLLECT_STATUSES = ['awaiting', 'collected', 'missed_window'] as const;
const RETURN_STATUSES  = ['not_started', 'in_transit', 'received_at_lab', 'processing', 'results_ready', 'failed'] as const;

const SELECT: React.CSSProperties = {
  background:   'var(--bg-page)',
  border:       '1px solid var(--border-mid)',
  color:        'var(--ink)',
  fontFamily:   'var(--font-mono)',
  fontSize:     11,
  padding:      '5px 8px',
  borderRadius: 'var(--radius-sm)',
  outline:      'none',
  appearance:   'none',
};

const TEXT: React.CSSProperties = {
  ...SELECT,
  width:      '100%',
  boxSizing:  'border-box',
  padding:    '7px 10px',
};

const LABEL: React.CSSProperties = {
  fontFamily:    'var(--font-mono)',
  fontSize:      9,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  color:         'var(--muted)',
  marginBottom:  3,
};

export function KitStatusUpdater({ kitId }: { kitId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [ship,     setShip]     = useState('');
  const [collect,  setCollect]  = useState('');
  const [ret,      setRet]      = useState('');
  const [tracking, setTracking] = useState('');
  const [labRef,   setLabRef]   = useState('');
  const [notes,    setNotes]    = useState('');
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  async function save() {
    setSaving(true);
    const payload: Record<string, string> = { id: kitId };
    if (ship)     payload.ship_status               = ship;
    if (collect)  payload.collection_status         = collect;
    if (ret)      payload.return_status             = ret;
    if (tracking) payload.tracking_number_outbound  = tracking;
    if (labRef)   payload.lab_reference_number      = labRef;
    if (notes)    payload.notes                     = notes;

    await fetch('/api/ops/kits', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      10,
          fontWeight:    600,
          letterSpacing: '0.5px',
          padding:       '5px 12px',
          background:    'var(--surface)',
          border:        '1px solid var(--border-mid)',
          color:         'var(--slate)',
          cursor:        'pointer',
          borderRadius:  'var(--radius-sm)',
        }}
      >
        Update status
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {([['Ship', ship, setShip, SHIP_STATUSES], ['Collect', collect, setCollect, COLLECT_STATUSES], ['Return', ret, setRet, RETURN_STATUSES]] as const).map(([label, val, setter, opts]) => (
          <div key={label as string}>
            <p style={LABEL}>{label as string}</p>
            <select value={val as string} onChange={(e) => (setter as (v: string) => void)(e.target.value)} style={SELECT}>
              <option value="">—</option>
              {(opts as readonly string[]).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <p style={LABEL}>Tracking #</p>
          <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="e.g. 1Z999..." style={TEXT} />
        </div>
        <div>
          <p style={LABEL}>Lab ref #</p>
          <input value={labRef} onChange={(e) => setLabRef(e.target.value)} placeholder="Lab reference" style={TEXT} />
        </div>
      </div>

      <div>
        <p style={LABEL}>Notes</p>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Chain-of-custody note…" style={TEXT} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => void save()}
          disabled={saving}
          style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      10,
            fontWeight:    600,
            letterSpacing: '0.5px',
            padding:       '6px 14px',
            background:    saved ? 'rgba(22,163,74,0.08)' : 'var(--teal)',
            border:        `1px solid ${saved ? 'rgba(22,163,74,0.3)' : 'var(--teal)'}`,
            color:         saved ? '#15803d' : '#fff',
            cursor:        'pointer',
            borderRadius:  'var(--radius-sm)',
            transition:    'all 150ms',
          }}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
        </button>
        <button
          onClick={() => setExpanded(false)}
          style={{
            fontFamily:   'var(--font-mono)',
            fontSize:     10,
            padding:      '6px 10px',
            background:   'var(--surface)',
            border:       '1px solid var(--border-mid)',
            color:        'var(--slate)',
            cursor:       'pointer',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
