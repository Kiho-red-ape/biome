'use client';

import { useState } from 'react';
import Link from 'next/link';

// ── Types ────────────────────────────────────────────────────────────────────

export type MilestoneRow = {
  id: string;
  study_milestone_id: string;
  status: string;
  completed_at: string | null;
  submitted_at: string | null;
  week_number: number;
  title: string;
  description: string | null;
  milestone_type: string;
  sort_order: number;
};

interface MilestonesTimelineProps {
  milestones: MilestoneRow[];
  currentWeek: number;
  experimentId: string;
  privyDid: string;
  onRefresh: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function MilestonesTimeline({
  milestones,
  currentWeek,
  experimentId,
  privyDid,
  onRefresh,
}: MilestonesTimelineProps) {
  const [submitting, setSubmitting] = useState<string | null>(null);

  // Group by week
  const weekMap = new Map<number, MilestoneRow[]>();
  for (const m of milestones) {
    if (!weekMap.has(m.week_number)) weekMap.set(m.week_number, []);
    weekMap.get(m.week_number)!.push(m);
  }
  const weeks = Array.from(weekMap.entries()).sort(([a], [b]) => a - b);

  if (weeks.length === 0) {
    return (
      <div style={{
        padding:    '32px 24px',
        textAlign:  'center',
        fontFamily: 'var(--font-body)',
        fontSize:   14,
        color:      'var(--muted)',
      }}>
        No milestones scheduled yet.
      </div>
    );
  }

  async function submit(milestoneId: string) {
    setSubmitting(milestoneId);
    try {
      const res = await fetch(`/api/milestones/${milestoneId}/submit`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ privyDid }),
      });
      if (res.ok) onRefresh();
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div style={{ padding: '20px 24px' }}>
      {weeks.map(([weekNum, wMilestones]) => {
        const isCurrentWeek = weekNum === currentWeek;
        const isPast        = weekNum < currentWeek;

        return (
          <div key={weekNum} style={{ marginBottom: 16 }}>
            {/* Week label */}
            <div style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      10,
              fontWeight:    600,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color:         isCurrentWeek ? 'var(--ink)' : 'var(--muted)',
              marginBottom:  8,
              display:       'flex',
              alignItems:    'center',
              gap:           8,
            }}>
              Week {weekNum}
              {isCurrentWeek && (
                <span style={{
                  background:   'var(--teal)',
                  color:        '#ffffff',
                  padding:      '1px 8px',
                  borderRadius: '4px',
                  fontSize:     9,
                }}>
                  Current
                </span>
              )}
              {isPast && !isCurrentWeek && (
                <span style={{
                  background:   'var(--bg-page)',
                  color:        'var(--muted)',
                  padding:      '1px 8px',
                  borderRadius: '4px',
                  fontSize:     9,
                  border:       '1px solid var(--border-soft)',
                }}>
                  Past
                </span>
              )}
            </div>

            {/* Milestones for this week */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {wMilestones.map((m) => {
                const isCompleted  = ['submitted', 'completed', 'verified'].includes(m.status);
                const isMissed     = ['missed', 'rejected'].includes(m.status);
                const isPending    = m.status === 'pending';
                const isSelfReport = m.milestone_type === 'self_report';

                return (
                  <div
                    key={m.id}
                    style={{
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'space-between',
                      padding:        '10px 16px',
                      border:         '1px solid var(--border-soft)',
                      borderRadius:   'var(--radius-sm)',
                      background:     isCompleted ? 'var(--bg-page)' : 'var(--surface)',
                      gap:            12,
                    }}
                  >
                    {/* Left: icon + text */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 700,
                        fontSize:   14,
                        color:      isCompleted ? 'var(--muted)' : isMissed ? '#dc2626' : 'var(--teal)',
                        flexShrink: 0,
                      }}>
                        {isCompleted ? '✓' : isMissed ? '✗' : '○'}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontFamily:   'var(--font-body)',
                          fontSize:     13,
                          color:        isCompleted ? 'var(--muted)' : 'var(--ink)',
                          overflow:     'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace:   'nowrap',
                        }}>
                          {m.title}
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-body)',
                          fontSize:   10,
                          color:      'var(--muted)',
                          marginTop:  1,
                        }}>
                          {isSelfReport ? 'You report' : 'Researcher confirms'}
                        </div>
                      </div>
                    </div>

                    {/* Right: action / status */}
                    <div style={{ flexShrink: 0 }}>
                      {isCompleted && (
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize:   11,
                          fontWeight: 600,
                          color:      'var(--muted)',
                        }}>
                          Done
                        </span>
                      )}
                      {isMissed && m.status === 'rejected' && (
                        <Link
                          href={`/disputes/raise?milestone_id=${m.id}&experiment_id=${experimentId}`}
                          style={{
                            fontFamily:     'var(--font-mono)',
                            fontSize:       10,
                            fontWeight:     700,
                            color:          '#dc2626',
                            textDecoration: 'none',
                          }}
                        >
                          Dispute
                        </Link>
                      )}
                      {isMissed && m.status === 'missed' && (
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize:   11,
                          color:      '#dc2626',
                        }}>
                          Missed
                        </span>
                      )}
                      {isPending && isSelfReport && (
                        <button
                          onClick={() => void submit(m.id)}
                          disabled={submitting === m.id}
                          style={{
                            fontFamily:   'var(--font-body)',
                            fontSize:     12,
                            fontWeight:   600,
                            background:   'var(--teal)',
                            color:        '#ffffff',
                            border:       'none',
                            borderRadius: 'var(--radius-sm)',
                            padding:      '5px 12px',
                            cursor:       submitting === m.id ? 'not-allowed' : 'pointer',
                            opacity:      submitting === m.id ? 0.5 : 1,
                          }}
                        >
                          {submitting === m.id ? '...' : 'Submit'}
                        </button>
                      )}
                      {isPending && !isSelfReport && (
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize:   11,
                          color:      'var(--muted)',
                        }}>
                          Awaiting
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
