'use client';

import { useState } from 'react';

interface Props { lead: Record<string, unknown> }

export function EstimateLeadRow({ lead }: Props) {
  const [contacted, setContacted] = useState(!!lead.contacted);
  const [notes,     setNotes]     = useState((lead.notes as string) ?? '');
  const [saving,    setSaving]    = useState(false);
  const [open,      setOpen]      = useState(false);

  const bd = lead.estimate_breakdown as Record<string, number> | null;

  async function markContacted() {
    setSaving(true);
    await fetch('/api/ops/estimate-leads', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: lead.id, contacted: true, notes }),
    });
    setContacted(true);
    setSaving(false);
  }

  async function saveNotes() {
    setSaving(true);
    await fetch('/api/ops/estimate-leads', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: lead.id, notes }),
    });
    setSaving(false);
  }

  return (
    <div style={{
      background: '#0b1014',
      border:     `1px solid ${contacted ? 'rgba(255,255,255,0.04)' : 'rgba(56,189,248,0.12)'}`,
      borderRadius: 2,
      overflow:   'hidden',
    }}>
      {/* Header row */}
      <div
        style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          padding:        '14px 20px',
          cursor:         'pointer',
          flexWrap:       'wrap',
          gap:            8,
        }}
        onClick={() => setOpen(o => !o)}
      >
        <div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#f8fafc' }}>
            {(lead.email as string)}
          </span>
          {!!lead.organization && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#475569', marginLeft: 10 }}>
              {lead.organization as string}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {!!lead.estimated_total && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#f59e0b' }}>
              ${(lead.estimated_total as number).toLocaleString()}
            </span>
          )}
          <span style={{
            fontFamily:   'var(--font-mono)',
            fontSize:     9,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color:        contacted ? '#475569' : '#38bdf8',
            border:       `1px solid ${contacted ? 'rgba(255,255,255,0.08)' : 'rgba(56,189,248,0.3)'}`,
            padding:      '2px 8px',
            borderRadius: 2,
          }}>
            {contacted ? 'contacted' : 'new'}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#475569' }}>
            {new Date(lead.created_at as string).toLocaleDateString()}
          </span>
          <span style={{ color: '#475569', fontSize: 10 }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded detail */}
      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          {/* Study details */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 16, marginBottom: 16,
          }}>
            {[
              ['Type',         lead.study_type],
              ['Sponsor',      lead.sponsor_type],
              ['Participants', lead.participants],
              ['Duration',     lead.duration],
              ['Geography',    (lead.geography as string[] | null)?.join(', ')],
              ['Samples',      (lead.samples as string[] | null)?.join(', ')],
              ['IRB',          lead.irb_status],
            ].filter(([, v]) => v).map(([k, v]) => (
              <span key={k as string} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#475569' }}>
                <span style={{ color: '#7f8e87' }}>{k as string}:</span> {String(v)}
              </span>
            ))}
          </div>

          {/* Estimate breakdown */}
          {bd && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16,
              padding: '12px 16px',
              background: 'rgba(245,158,11,0.03)',
              border: '1px solid rgba(245,158,11,0.08)',
              borderRadius: 2,
            }}>
              {Object.entries(bd).map(([k, v]) => (
                <span key={k} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8' }}>
                  <span style={{ color: '#7f8e87' }}>{k}:</span> ${v.toLocaleString()}
                </span>
              ))}
            </div>
          )}

          {/* Notes */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal notes…"
            rows={2}
            style={{
              width:       '100%',
              fontFamily:  'var(--font-mono)',
              fontSize:    12,
              color:       '#94a3b8',
              background:  'rgba(255,255,255,0.03)',
              border:      '1px solid rgba(255,255,255,0.08)',
              borderRadius: 2,
              padding:     '8px 12px',
              resize:      'vertical',
              outline:     'none',
              marginBottom: 12,
              boxSizing:   'border-box',
            }}
          />

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            {!contacted && (
              <button
                onClick={markContacted}
                disabled={saving}
                style={{
                  fontFamily:    'var(--font-mono)',
                  fontSize:      10,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  padding:       '6px 16px',
                  background:    'rgba(56,189,248,0.08)',
                  border:        '1px solid rgba(56,189,248,0.3)',
                  color:         '#38bdf8',
                  borderRadius:  2,
                  cursor:        'pointer',
                }}
              >
                {saving ? 'Saving…' : '✓ Mark contacted'}
              </button>
            )}
            <button
              onClick={saveNotes}
              disabled={saving}
              style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      10,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                padding:       '6px 16px',
                background:    'transparent',
                border:        '1px solid rgba(255,255,255,0.1)',
                color:         '#475569',
                borderRadius:  2,
                cursor:        'pointer',
              }}
            >
              Save notes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
