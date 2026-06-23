'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashCard, CardLabel } from './card';
import type { TaskItem, TaskKind, TaskUrgency } from '@/lib/dashboard/tasks';

// ── Urgency presentation ──────────────────────────────────────────────────────
const URGENCY: Record<TaskUrgency, { border: string; label: string | null; color: string }> = {
  overdue:  { border: '#dc2626',            label: 'Overdue',  color: '#dc2626'        },
  due_soon: { border: 'var(--teal)',        label: 'Due soon', color: 'var(--teal-dark)' },
  normal:   { border: 'var(--border-soft)', label: null,       color: 'var(--muted)'   },
};

// ── Inline line icons per task kind (no emoji) ────────────────────────────────
function TaskIcon({ kind }: { kind: TaskKind }) {
  const common = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const };
  switch (kind) {
    case 'sign_document':
    case 'accept_agreement':
      return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/></svg>;
    case 'eligibility_quiz':
      return <svg {...common}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
    case 'self_report':
      return <svg {...common}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>;
    case 'collect_sample':
      return <svg {...common}><path d="M9 3h6"/><path d="M10 3v6.5L5 18a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-8.5V3"/></svg>;
    case 'ship_sample':
      return <svg {...common}><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
    case 'phlebotomy':
      return <svg {...common}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>;
    case 'reply_message':
      return <svg {...common}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/></svg>;
    case 'configure_payout':
      return <svg {...common}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>;
    case 'resolve_dispute':
      return <svg {...common}><path d="M10.3 3.3a2.4 2.4 0 0 1 3.4 0l7 7a2.4 2.4 0 0 1 0 3.4l-7 7a2.4 2.4 0 0 1-3.4 0l-7-7a2.4 2.4 0 0 1 0-3.4Z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
  }
}

export function NeedsAttention({ privyDid, filterStudyId }: { privyDid: string; filterStudyId?: string }) {
  const [tasks,   setTasks]   = useState<TaskItem[] | null>(null);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/dashboard/tasks?privyDid=${encodeURIComponent(privyDid)}`)
      .then((r) => r.json())
      .then((d: { tasks?: TaskItem[] }) => { if (active) setTasks(d.tasks ?? []); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [privyDid]);

  // Stay silent while loading, on error, or when there's nothing to do — keeps a calm hub.
  if (error || !tasks) return null;

  const visible = filterStudyId
    ? tasks.filter((t) => t.studyId === filterStudyId || t.kind === 'configure_payout')
    : tasks;

  if (visible.length === 0) return null;

  return (
    <DashCard>
      <CardLabel>
        Needs Your Attention
        <span style={{
          marginLeft: 10, background: 'var(--teal)', color: '#fff', borderRadius: 999,
          fontSize: 10, fontWeight: 700, padding: '1px 8px', letterSpacing: 0,
        }}>
          {visible.length}
        </span>
      </CardLabel>
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map((t) => {
          const u = URGENCY[t.urgency];
          return (
            <Link key={t.id} href={t.href} style={{
              display:        'flex',
              alignItems:     'center',
              gap:            12,
              padding:        '12px 16px',
              borderRadius:   'var(--radius-sm)',
              border:         '1px solid var(--border-soft)',
              borderLeft:     `3px solid ${u.border}`,
              background:     'var(--surface)',
              textDecoration: 'none',
            }}>
              <span style={{ color: u.color, flexShrink: 0, display: 'flex' }}>
                <TaskIcon kind={t.kind} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {t.label}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginTop: 2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.studyTitle}
                </div>
              </div>
              {u.label && (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                  letterSpacing: '1px', textTransform: 'uppercase', color: u.color,
                  flexShrink: 0,
                }}>
                  {u.label}
                </span>
              )}
              <span style={{ color: 'var(--muted)', flexShrink: 0, fontSize: 16, lineHeight: 1 }}>›</span>
            </Link>
          );
        })}
      </div>
    </DashCard>
  );
}
