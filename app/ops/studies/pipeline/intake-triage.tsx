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
  const [status, setStatus] = useState(currentStatus);
  const [notes,  setNotes]  = useState(currentNotes ?? '');
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {STATUSES.map((s) => {
          const on = status === s;
          return (
            <button
              key={s}
              onClick={() => setStatus(s)}
              style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      10,
                fontWeight:    600,
                letterSpacing: '0.5px',
                padding:       '4px 12px',
                borderRadius:  999,
                border:        `1px solid ${on ? 'var(--teal)' : 'var(--border-mid)'}`,
                background:    on ? 'var(--teal-soft)' : 'var(--surface)',
                color:         on ? 'var(--teal-dark)' : 'var(--slate)',
                cursor:        'pointer',
                transition:    'all 100ms',
              }}
            >
              {s}
            </button>
          );
        })}
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Triage notes…"
        rows={2}
        style={{
          width:        '100%',
          background:   'var(--bg-page)',
          border:       '1px solid var(--border-mid)',
          color:        'var(--ink)',
          fontFamily:   'var(--font-mono)',
          fontSize:     12,
          padding:      '8px 10px',
          resize:       'vertical',
          outline:      'none',
          borderRadius: 'var(--radius-sm)',
          boxSizing:    'border-box',
        }}
      />

      <button
        onClick={() => void save()}
        disabled={saving}
        style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      11,
          fontWeight:    600,
          letterSpacing: '0.5px',
          padding:       '7px 16px',
          background:    saved ? 'rgba(22,163,74,0.08)' : 'var(--surface)',
          border:        `1px solid ${saved ? 'rgba(22,163,74,0.3)' : 'var(--border-mid)'}`,
          color:         saved ? '#15803d' : 'var(--slate)',
          cursor:        'pointer',
          borderRadius:  'var(--radius-sm)',
          alignSelf:     'flex-start',
          transition:    'all 150ms',
        }}
      >
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save triage'}
      </button>
    </div>
  );
}
