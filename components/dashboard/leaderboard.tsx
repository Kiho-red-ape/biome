'use client';

import Link from 'next/link';
import { Identicon } from '@/components/identicon';
import { countryFlag } from '@/lib/utils/profile';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeaderRow {
  participant_id: string;
  pseudonym: string;
  country: string;
  previous_study_count: number;
  completion_rate: number;
  reliability_score: number;
}

interface Props {
  leaders: LeaderRow[];
}

// ─── Reliability color ────────────────────────────────────────────────────────

function relColor(score: number): string {
  if (score >= 90) return '#b7ff61';
  if (score >= 80) return '#8ee7ff';
  return '#ffd166';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Leaderboard({ leaders }: Props) {
  if (leaders.length === 0) {
    return (
      <section style={{ padding: '0 40px 40px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginTop: 28, marginBottom: 14,
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '3px',
            textTransform: 'uppercase', color: '#7f8e87', whiteSpace: 'nowrap',
          }}>
            // TOP_PARTICIPANTS
          </span>
          <div style={{ flex: 1, height: 1, background: '#7f8e87', opacity: 0.2 }} />
        </div>
        <div style={{
          padding: '48px 24px', textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.06)',
          background: '#0b1014',
        }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4a7055' }}>
            // LEADERBOARD_EMPTY — complete 3+ experiments to appear here
          </p>
        </div>
      </section>
    );
  }

  return (
    <section style={{ padding: '0 40px 40px' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginTop: 28, marginBottom: 14,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '3px',
          textTransform: 'uppercase', color: '#7f8e87', whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          // TOP_PARTICIPANTS
        </span>
        <div style={{ flex: 1, height: 1, background: '#7f8e87', opacity: 0.2 }} />
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9, color: '#4a7055',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          min. 3 experiments to qualify
        </span>
      </div>

      {/* Rows */}
      <div style={{ border: '1px solid rgba(255,255,255,0.06)', background: '#0b1014' }}>

        {/* Column header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '32px 44px 1fr 28px 80px 70px 80px 40px',
          gap: 8,
          padding: '8px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          alignItems: 'center',
        }}>
          {['#', '', 'PARTICIPANT', '', 'STUDIES', 'RATE', 'RELIABILITY', ''].map((h, i) => (
            <span key={i} style={{
              fontFamily: 'var(--font-mono)', fontSize: 9,
              textTransform: 'uppercase', letterSpacing: '1.5px',
              color: '#4a7055',
            }}>
              {h}
            </span>
          ))}
        </div>

        {leaders.slice(0, 10).map((p, i) => {
          const rank   = i + 1;
          const rc     = relColor(p.reliability_score);
          const rankColor =
            rank === 1 ? '#b7ff61' :
            rank <= 3  ? '#eef4f0' :
            '#7f8e87';

          return (
            <div
              key={p.participant_id}
              style={{
                display: 'grid',
                gridTemplateColumns: '32px 44px 1fr 28px 80px 70px 80px 40px',
                gap: 8,
                padding: '0 16px',
                height: 44,
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(183,255,97,0.02)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {/* Rank */}
              <span style={{
                fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700,
                color: rankColor,
              }}>
                #{rank}
              </span>

              {/* Identicon */}
              <Identicon participantId={p.participant_id} size={28} />

              {/* Pseudonym */}
              <Link
                href={`/profile/${p.participant_id}`}
                style={{
                  fontFamily: 'var(--font-heading)', fontSize: 14,
                  color: '#eef4f0', textDecoration: 'none',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  transition: 'color 150ms ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#b7ff61'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#eef4f0'; }}
              >
                {p.pseudonym}
              </Link>

              {/* Country flag */}
              <span style={{ fontSize: 16 }}>{countryFlag(p.country)}</span>

              {/* Studies */}
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, color: '#aab8b1',
              }}>
                {p.previous_study_count} studies
              </span>

              {/* Completion rate */}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#aab8b1' }}>
                {p.completion_rate.toFixed(1)}%
              </span>

              {/* Reliability score */}
              <span style={{
                fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: rc,
              }}>
                {p.reliability_score.toFixed(1)}
              </span>

              {/* Mini reliability bar */}
              <div style={{ width: 32, height: 3, background: 'rgba(255,255,255,0.06)' }}>
                <div style={{
                  height: 3,
                  width: `${Math.min(100, p.reliability_score)}%`,
                  background: rc,
                }} />
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
}
