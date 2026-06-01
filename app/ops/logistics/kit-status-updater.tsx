'use client';

import { useState } from 'react';

const SHIP_STATUSES    = ['pending', 'shipped', 'delivered', 'returned_undeliverable'] as const;
const COLLECT_STATUSES = ['awaiting', 'collected', 'missed_window'] as const;
const RETURN_STATUSES  = ['not_started', 'in_transit', 'received_at_lab', 'processing', 'results_ready', 'failed'] as const;

export function KitStatusUpdater({ kitId }: { kitId: string }) {
  const [expanded,  setExpanded]  = useState(false);
  const [ship,      setShip]      = useState('');
  const [collect,   setCollect]   = useState('');
  const [ret,       setRet]       = useState('');
  const [tracking,  setTracking]  = useState('');
  const [labRef,    setLabRef]    = useState('');
  const [notes,     setNotes]     = useState('');
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);

  async function save() {
    setSaving(true);
    const payload: Record<string, string> = { id: kitId };
    if (ship)     payload.ship_status      = ship;
    if (collect)  payload.collection_status = collect;
    if (ret)      payload.return_status    = ret;
    if (tracking) payload.tracking_number_outbound = tracking;
    if (labRef)   payload.lab_reference_number = labRef;
    if (notes)    payload.notes = notes;

    await fetch('/api/ops/kits', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const SELECT: React.CSSProperties = {
    background:   '#060a14',
    border:       '1px solid rgba(255,255,255,0.08)',
    color:        '#94a3b8',
    fontFamily:   'var(--font-mono)',
    fontSize:     11,
    padding:      '5px 8px',
    borderRadius: 2,
    outline:      'none',
    appearance:   'none',
  };

  const TEXT: React.CSSProperties = {
    ...SELECT,
    width: '100%',
    boxSizing: 'border-box',
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        style={{
          fontFamily:   'var(--font-mono)',
          fontSize:     10,
          padding:      '4px 10px',
          background:   'transparent',
          border:       '1px solid rgba(255,179,0,0.2)',
          color:        '#ffb300',
          cursor:       'pointer',
          borderRadius: 2,
          letterSpacing: '1px',
          textTransform: 'uppercase',
        }}
      >
        Update status
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#475569', marginBottom: 3, letterSpacing: '1px', textTransform: 'uppercase' }}>Ship</p>
          <select value={ship} onChange={(e) => setShip(e.target.value)} style={SELECT}>
            <option value="">—</option>
            {SHIP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#475569', marginBottom: 3, letterSpacing: '1px', textTransform: 'uppercase' }}>Collect</p>
          <select value={collect} onChange={(e) => setCollect(e.target.value)} style={SELECT}>
            <option value="">—</option>
            {COLLECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#475569', marginBottom: 3, letterSpacing: '1px', textTransform: 'uppercase' }}>Return</p>
          <select value={ret} onChange={(e) => setRet(e.target.value)} style={SELECT}>
            <option value="">—</option>
            {RETURN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#475569', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '1px' }}>Tracking #</p>
          <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="e.g. 1Z999..." style={TEXT} />
        </div>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#475569', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '1px' }}>Lab ref #</p>
          <input value={labRef} onChange={(e) => setLabRef(e.target.value)} placeholder="Lab reference" style={TEXT} />
        </div>
      </div>

      <div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#475569', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '1px' }}>Notes</p>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Chain-of-custody note…" style={TEXT} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => void save()}
          disabled={saving}
          style={{
            fontFamily:   'var(--font-mono)',
            fontSize:     10,
            padding:      '6px 14px',
            background:   saved ? 'rgba(245,158,11,0.1)' : 'rgba(255,179,0,0.08)',
            border:       `1px solid ${saved ? 'rgba(245,158,11,0.3)' : 'rgba(255,179,0,0.2)'}`,
            color:        saved ? '#f59e0b' : '#ffb300',
            cursor:       'pointer',
            borderRadius: 2,
            textTransform: 'uppercase',
            letterSpacing: '1px',
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
            background:   'transparent',
            border:       '1px solid rgba(255,255,255,0.06)',
            color:        '#475569',
            cursor:       'pointer',
            borderRadius: 2,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
