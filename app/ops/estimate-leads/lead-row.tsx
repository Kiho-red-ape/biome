'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { OpsCard, OpsBadge } from '../_components/ui';
import { OpsDeleteButton } from '../_components/delete-button';

interface Props { lead: Record<string, unknown> }

const TA: React.CSSProperties = {
  fontFamily:   'var(--font-mono)',
  fontSize:     12,
  color:        'var(--ink)',
  background:   'var(--bg-page)',
  border:       '1px solid var(--border-mid)',
  borderRadius: 'var(--radius-sm)',
  padding:      '8px 12px',
  resize:       'vertical',
  outline:      'none',
  width:        '100%',
  boxSizing:    'border-box',
  lineHeight:   1.6,
};

export function EstimateLeadRow({ lead }: Props) {
  const { user } = usePrivy();
  const [contacted, setContacted] = useState(!!lead.contacted);
  const [notes,     setNotes]     = useState((lead.notes as string) ?? '');
  const [saving,    setSaving]    = useState(false);
  const [open,      setOpen]      = useState(false);
  const [intakeId,  setIntakeId]  = useState<string | null>((lead.converted_intake_id as string | null) ?? null);
  const [moving,    setMoving]    = useState(false);
  const [moveErr,   setMoveErr]   = useState<string | null>(null);

  async function moveToPipeline() {
    if (!user) { setMoveErr('Not signed in'); return; }
    setMoving(true);
    setMoveErr(null);
    try {
      const res = await fetch('/api/ops/estimate-leads/to-pipeline', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: lead.id, operatorPrivyDid: user.id }),
      });
      const data = (await res.json()) as { intakeId?: string; error?: string };
      if (data.intakeId) { setIntakeId(data.intakeId); setContacted(true); }
      else setMoveErr(data.error ?? `Failed (HTTP ${res.status})`);
    } catch {
      setMoveErr('Network error — try again');
    } finally {
      setMoving(false);
    }
  }

  const rawBd    = lead.estimate_breakdown as Record<string, unknown> | null;
  const internal = (rawBd?.internal ?? null) as {
    recruitmentCost?: number; sampleCost?: number; compensationCost?: number;
    passThroughCost?: number; serviceFee?: number; recruitTarget?: number;
    estimatedActualCost?: number; estimatedMargin?: number; riskFlags?: string[];
  } | null;
  const buckets  = (rawBd?.buckets ?? null) as Record<string, number> | null;
  const legacyBd = !internal && !buckets && rawBd ? (rawBd as Record<string, number>) : null;
  const clientTotal = lead.estimated_total as number | undefined;

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
    <OpsCard style={{ overflow: 'hidden', opacity: contacted ? 0.75 : 1 }}>
      {/* Header row — always visible */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          padding:        '14px 20px',
          cursor:         'pointer',
          flexWrap:       'wrap',
          gap:            8,
        }}
      >
        <div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
            {lead.email as string}
          </span>
          {!!lead.organization && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginLeft: 10 }}>
              {lead.organization as string}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!!lead.estimated_total && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--teal-dark)' }}>
              ${(lead.estimated_total as number).toLocaleString()}
            </span>
          )}
          <OpsBadge tone={intakeId ? 'green' : contacted ? 'slate' : 'teal'}>
            {intakeId ? 'in pipeline' : contacted ? 'contacted' : 'new'}
          </OpsBadge>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
            {new Date(lead.created_at as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
          <span style={{ color: 'var(--muted)', fontSize: 10 }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded detail */}
      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border-soft)' }}>
          {/* Study meta */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 16, marginBottom: 16 }}>
            {[
              ['Type',         lead.study_type],
              ['Sponsor',      lead.sponsor_type],
              ['Participants', lead.participants],
              ['Duration',     lead.duration],
              ['Geography',    (lead.geography as string[] | null)?.join(', ')],
              ['Samples',      (lead.samples as string[] | null)?.join(', ')],
              ['IRB',          lead.irb_status],
            ].filter(([, v]) => v).map(([k, v]) => (
              <span key={k as string} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)' }}>
                <span style={{ color: 'var(--muted)' }}>{k as string}:</span> {String(v)}
              </span>
            ))}
          </div>

          {/* Internal breakdown */}
          {internal && (
            <div style={{
              marginBottom: 16,
              padding:      '14px 16px',
              background:   'var(--bg-page)',
              border:       '1px solid var(--border-soft)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>
                Internal estimate · operator only
              </p>

              {clientTotal !== undefined && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--slate)', marginBottom: 12 }}>
                  <span style={{ color: 'var(--muted)' }}>Client sees total:</span>{' '}
                  <span style={{ color: 'var(--ink)', fontWeight: 700 }}>${clientTotal.toLocaleString()}</span>
                </p>
              )}

              {(() => {
                const rows2: [string, string][] = [
                  ['Recruitment (risk + dropout)', internal.recruitmentCost  != null ? `$${internal.recruitmentCost.toLocaleString()}`  : '—'],
                  ['Samples (kits + shipping + lab)', internal.sampleCost   != null ? `$${internal.sampleCost.toLocaleString()}`        : '—'],
                  ['Compensation',                    internal.compensationCost != null ? `$${internal.compensationCost.toLocaleString()}` : '—'],
                  ['Pass-through subtotal',           internal.passThroughCost  != null ? `$${internal.passThroughCost.toLocaleString()}`  : '—'],
                  ['Service fee (margin)',             internal.serviceFee       != null ? `$${internal.serviceFee.toLocaleString()}`       : '—'],
                  ['Client total',                    clientTotal               != null ? `$${clientTotal.toLocaleString()}`               : '—'],
                ];
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                    {rows2.map(([k, v], i) => (
                      <div key={k} style={{
                        display:     'flex',
                        justifyContent: 'space-between',
                        gap:         16,
                        paddingTop:  i === 3 || i === 5 ? 5 : 0,
                        borderTop:   i === 3 || i === 5 ? '1px solid var(--border-soft)' : 'none',
                      }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>{k}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: i >= 3 ? 'var(--ink)' : 'var(--slate)', fontWeight: i === 5 ? 700 : 400 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, paddingTop: 10, borderTop: '1px solid var(--border-soft)' }}>
                {internal.estimatedActualCost != null && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)' }}>
                    <span style={{ color: 'var(--muted)' }}>Est. cost to deliver:</span> ${internal.estimatedActualCost.toLocaleString()}
                  </span>
                )}
                {internal.estimatedMargin != null && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#15803d', fontWeight: 600 }}>
                    <span style={{ color: 'var(--muted)', fontWeight: 400 }}>Est. gross margin:</span> {internal.estimatedMargin}%
                  </span>
                )}
                {internal.recruitTarget != null && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)' }}>
                    <span style={{ color: 'var(--muted)' }}>Recruit target (30% buffer):</span> {internal.recruitTarget}
                  </span>
                )}
              </div>

              {internal.riskFlags && internal.riskFlags.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {internal.riskFlags.map(flag => (
                    <OpsBadge key={flag} tone="amber">{flag}</OpsBadge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Legacy flat breakdown */}
          {legacyBd && (
            <div style={{
              display:      'flex',
              flexWrap:     'wrap',
              gap:          14,
              marginBottom: 16,
              padding:      '12px 16px',
              background:   'var(--bg-page)',
              border:       '1px solid var(--border-soft)',
              borderRadius: 'var(--radius-sm)',
            }}>
              {Object.entries(legacyBd).map(([k, v]) => (
                <span key={k} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)' }}>
                  <span style={{ color: 'var(--muted)' }}>{k}:</span> ${typeof v === 'number' ? v.toLocaleString() : String(v)}
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
            style={{ ...TA, marginBottom: 12 }}
          />

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {intakeId ? (
              <Link
                href="/ops/studies/pipeline"
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.5px',
                  padding: '7px 16px', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.3)',
                  color: '#15803d', borderRadius: 'var(--radius-sm)', textDecoration: 'none',
                }}
              >
                ✓ In pipeline — open →
              </Link>
            ) : (
              <button
                onClick={() => void moveToPipeline()}
                disabled={moving}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.5px',
                  padding: '7px 16px', background: 'var(--teal)', border: '1px solid var(--teal)',
                  color: '#fff', borderRadius: 'var(--radius-sm)', cursor: moving ? 'default' : 'pointer',
                  opacity: moving ? 0.6 : 1,
                }}
              >
                {moving ? 'Moving…' : 'Move to pipeline →'}
              </button>
            )}
            {moveErr && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#b91c1c' }}>{moveErr}</span>
            )}
            {!contacted && (
              <button
                onClick={() => void markContacted()}
                disabled={saving}
                style={{
                  fontFamily:    'var(--font-mono)',
                  fontSize:      11,
                  fontWeight:    600,
                  letterSpacing: '0.5px',
                  padding:       '7px 16px',
                  background:    'var(--teal)',
                  border:        '1px solid var(--teal)',
                  color:         '#fff',
                  borderRadius:  'var(--radius-sm)',
                  cursor:        saving ? 'default' : 'pointer',
                  opacity:       saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Saving…' : '✓ Mark contacted'}
              </button>
            )}
            <button
              onClick={() => void saveNotes()}
              disabled={saving}
              style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      11,
                fontWeight:    600,
                letterSpacing: '0.5px',
                padding:       '7px 16px',
                background:    'var(--surface)',
                border:        '1px solid var(--border-mid)',
                color:         'var(--slate)',
                borderRadius:  'var(--radius-sm)',
                cursor:        saving ? 'default' : 'pointer',
                opacity:       saving ? 0.6 : 1,
              }}
            >
              Save notes
            </button>
            <span style={{ marginLeft: 'auto' }}>
              <OpsDeleteButton endpoint="/api/ops/estimate-leads" payload={{ id: lead.id }} label="Delete lead" />
            </span>
          </div>
        </div>
      )}
    </OpsCard>
  );
}
