'use client';

import { useState } from 'react';

const STATUSES = ['new', 'reviewing', 'qualified', 'nurture', 'declined', 'converted'] as const;

export function IntakeTriage({
  intakeId,
  currentStatus,
  currentNotes,
}: {
  intakeId: string;
  currentStatus: string;
  currentNotes: string | null;
}) {
  const [status, setStatus]   = useState(currentStatus);
  const [notes,  setNotes]    = useState(currentNotes ?? '');
  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState(false);

  async function save() {
    setSaving(true);
    await fetch('/api/ops/intakes', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: intakeId, triage_status: status, triage_notes: notes }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Status buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            style={{
              fontFamily:   'var(--font-mono)',
              fontSize:     10,
              padding:      '4px 10px',
              background:   status === s ? 'rgba(255,179,0,0.1)' : 'transparent',
              border:       `1px solid ${status === s ? 'rgba(255,179,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color:        status === s ? '#ffb300' : '#4a6050',
              cursor:       'pointer',
              borderRadius: 2,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              transition:   'all 100ms',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Notes */}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Triage notes…"
        rows={2}
        style={{
          width:        '100%',
          background:   '#050709',
          border:       '1px solid rgba(255,255,255,0.06)',
          color:        '#aab8b1',
          fontFamily:   'var(--font-mono)',
          fontSize:     11,
          padding:      '8px 10px',
          resize:       'vertical',
          outline:      'none',
          borderRadius: 2,
          boxSizing:    'border-box',
        }}
      />

      <button
        onClick={() => void save()}
        disabled={saving}
        style={{
          fontFamily:   'var(--font-mono)',
          fontSize:     10,
          padding:      '6px 14px',
          background:   saved ? 'rgba(183,255,97,0.1)' : 'rgba(255,179,0,0.08)',
          border:       `1px solid ${saved ? 'rgba(183,255,97,0.3)' : 'rgba(255,179,0,0.2)'}`,
          color:        saved ? '#b7ff61' : '#ffb300',
          cursor:       'pointer',
          borderRadius: 2,
          alignSelf:    'flex-start',
          transition:   'all 150ms',
          letterSpacing: '1px',
          textTransform: 'uppercase',
        }}
      >
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save triage'}
      </button>
    </div>
  );
}
