'use client';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { Identicon } from '@/components/identicon';

export type LeaderboardRow = {
  participant_id: string;
  pseudonym: string;
  country: string | null;
  previous_study_count: number;
  completion_rate: number | null;
  reliability_score: number | null;
};

interface Props {
  rows: LeaderboardRow[];
  currentUserParticipantId: string | null; // unused — component self-fetches
}

const RANK_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32', '#b7ff61', '#b7ff61'];
const RANK_LABELS = ['1ST', '2ND', '3RD', '4TH', '5TH'];

function reputationLabel(rate: number | null, count: number): string {
  if (count >= 10 && (rate ?? 0) >= 90) return 'ELITE';
  if (count >= 5  && (rate ?? 0) >= 80) return 'VERIFIED';
  if (count >= 2)                        return 'ACTIVE';
  if (count >= 1)                        return 'NEWCOMER';
  return 'OBSERVER';
}

function reputationColor(label: string): string {
  if (label === 'ELITE')    return '#ffd700';
  if (label === 'VERIFIED') return '#b7ff61';
  if (label === 'ACTIVE')   return '#8ee7ff';
  return '#4a7055';
}

// Estimated earnings: studies × avg $40 bounty (rough platform average)
const AVG_BOUNTY = 40;

// Single flat row: RANK | ICON | NAME | REP | STUDIES | RATE | EARNINGS | COUNTRY
const ROW_COLS = '52px 34px 1fr 88px 72px 72px 100px 64px';

function RankRow({
  row, rank, isUser, isPinned,
}: {
  row: LeaderboardRow;
  rank: number;
  isUser: boolean;
  isPinned: boolean;
}) {
  const rep       = reputationLabel(row.completion_rate, row.previous_study_count);
  const repColor  = reputationColor(rep);
  const rankColor = isPinned ? (RANK_COLORS[rank] ?? '#4a7055') : '#4a7055';
  const estEarned = row.previous_study_count * AVG_BOUNTY;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: ROW_COLS,
        alignItems: 'center',
        gap: '0 12px',
        padding: '10px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: isUser
          ? 'rgba(183,255,97,0.05)'
          : isPinned && rank < 3
            ? 'rgba(255,255,255,0.015)'
            : 'transparent',
        borderLeft: isUser ? '2px solid #b7ff61' : '2px solid transparent',
      }}
    >
      {/* Rank */}
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
        color: rankColor, letterSpacing: '1px',
      }}>
        {isPinned ? RANK_LABELS[rank] : `#${rank + 1}`}
      </span>

      {/* Identicon */}
      <Identicon participantId={row.participant_id} size={28} />

      {/* Name + YOU badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', minWidth: 0 }}>
        <Link
          href={`/profile/${row.participant_id}`}
          style={{
            fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: isUser ? 700 : 500,
            color: isUser ? '#eef4f0' : '#aab8b1',
            textDecoration: 'none',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            flexShrink: 1, minWidth: 0,
          }}
        >
          {row.pseudonym}
        </Link>
        {isUser && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 8, color: '#070c07',
            background: '#b7ff61', padding: '1px 5px', borderRadius: 2,
            flexShrink: 0, fontWeight: 700, letterSpacing: '0.5px',
          }}>
            YOU
          </span>
        )}
      </div>

      {/* Reputation badge */}
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 8,
        textTransform: 'uppercase', letterSpacing: '1px',
        color: repColor,
        border: `1px solid ${repColor}40`,
        background: `${repColor}0a`,
        padding: '3px 7px',
        borderRadius: 2,
        whiteSpace: 'nowrap',
        justifySelf: 'start',
      }}>
        {rep}
      </span>

      {/* Studies */}
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
        color: '#aab8b1', textAlign: 'center',
      }}>
        {row.previous_study_count}
        <span style={{ fontSize: 8, color: '#4a7055', marginLeft: 3 }}>
          {row.previous_study_count === 1 ? 'study' : 'studies'}
        </span>
      </span>

      {/* Completion rate */}
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
        color: (row.completion_rate ?? 0) >= 90 ? '#b7ff61' : '#4a7055',
        textAlign: 'center',
      }}>
        {row.completion_rate != null ? `${row.completion_rate.toFixed(0)}%` : '—'}
        <span style={{ fontSize: 8, color: '#4a7055', marginLeft: 2 }}>done</span>
      </span>

      {/* Estimated earnings */}
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
        color: '#ffd700', textAlign: 'center',
      }}>
        {row.previous_study_count > 0 ? `~$${estEarned}` : '—'}
        <span style={{ fontSize: 8, color: '#9a7a00', marginLeft: 2 }}>earned</span>
      </span>

      {/* Country */}
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 9,
        color: '#4a7055', whiteSpace: 'nowrap', textAlign: 'right',
      }}>
        {row.country ?? ''}
      </span>
    </div>
  );
}

export function ParticipantLeaderboard({ rows }: Props) {
  const { authenticated, user, ready } = usePrivy();
  const [currentUserParticipantId, setCurrentUserParticipantId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !authenticated || !user) { setCurrentUserParticipantId(null); return; }
    fetch(`/api/participant-profile?privyDid=${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then((d: { profile?: { participant_id?: string } }) => {
        setCurrentUserParticipantId(d.profile?.participant_id ?? null);
      })
      .catch(() => {});
  }, [ready, authenticated, user]);

  const pinnedRows   = rows.slice(0, 5);
  const scrollRows   = rows.slice(5);
  const userRank     = currentUserParticipantId
    ? rows.findIndex((r) => r.participant_id === currentUserParticipantId)
    : -1;
  const userInTop5   = userRank >= 0 && userRank < 5;

  return (
    <div style={{
      margin: '0 0 24px',
      border: '1px solid rgba(183,255,97,0.12)',
      borderRadius: 4,
      overflow: 'hidden',
      background: '#0a0f0a',
    }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'rgba(183,255,97,0.03)',
        borderBottom: '1px solid rgba(183,255,97,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            textTransform: 'uppercase', letterSpacing: '3px', color: '#b7ff61',
          }}>
            // PARTICIPANT_RANKINGS
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            color: '#4a7055', border: '1px solid rgba(183,255,97,0.12)',
            padding: '1px 6px',
          }}>
            {rows.length} ranked
          </span>
        </div>
        {!authenticated && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#4a7055' }}>
            Sign in to see your rank
          </span>
        )}
        {authenticated && userRank >= 0 && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#b7ff61' }}>
            Your rank: #{userRank + 1}
          </span>
        )}
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: ROW_COLS,
        gap: '0 12px',
        padding: '6px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        {(['RANK', '', 'PARTICIPANT', 'REPUTATION', 'STUDIES', 'COMPLETION', 'REWARDS', 'REGION'] as const).map((h, i) => (
          <span key={h + i} style={{
            fontFamily: 'var(--font-mono)', fontSize: 8,
            textTransform: 'uppercase', letterSpacing: '1.5px', color: '#4a7055',
            textAlign: i >= 4 ? 'center' : 'left',
          }}>
            {h}
          </span>
        ))}
      </div>

      {/* Top 5 — fixed/pinned */}
      <div>
        {pinnedRows.map((row, i) => (
          <RankRow
            key={row.participant_id}
            row={row}
            rank={i}
            isUser={row.participant_id === currentUserParticipantId}
            isPinned
          />
        ))}
      </div>

      {/* Remaining — scrollable */}
      {scrollRows.length > 0 && (
        <div style={{
          maxHeight: 200, overflowY: 'auto',
          borderTop: '1px solid rgba(183,255,97,0.08)',
        }}>
          {scrollRows.map((row, i) => (
            <RankRow
              key={row.participant_id}
              row={row}
              rank={5 + i}
              isUser={row.participant_id === currentUserParticipantId}
              isPinned={false}
            />
          ))}
        </div>
      )}

      {/* User not in list — show their rank at bottom */}
      {authenticated && userRank === -1 && (
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid rgba(183,255,97,0.08)',
          fontFamily: 'var(--font-mono)', fontSize: 9, color: '#4a7055',
        }}>
          Complete studies to appear on the leaderboard →
        </div>
      )}
      {authenticated && !userInTop5 && userRank >= 5 && (() => {
        const r = rows[userRank];
        const rep = r ? reputationLabel(r.completion_rate, r.previous_study_count) : '';
        const repColor = reputationColor(rep);
        const estEarned = r ? r.previous_study_count * AVG_BOUNTY : 0;
        return (
          <div style={{
            padding: '8px 16px',
            borderTop: '1px solid rgba(183,255,97,0.1)',
            background: 'rgba(183,255,97,0.03)',
            borderLeft: '2px solid #b7ff61',
            display: 'grid',
            gridTemplateColumns: ROW_COLS,
            gap: '0 12px',
            alignItems: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#b7ff61', fontWeight: 700 }}>
              #{userRank + 1}
            </span>
            <Identicon participantId={r?.participant_id ?? ''} size={28} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#b7ff61', fontWeight: 700 }}>
              You
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 8, textTransform: 'uppercase',
              letterSpacing: '1px', color: repColor,
              border: `1px solid ${repColor}40`, background: `${repColor}0a`,
              padding: '3px 7px', borderRadius: 2, whiteSpace: 'nowrap', justifySelf: 'start',
            }}>{rep}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#aab8b1', textAlign: 'center' }}>
              {r?.previous_study_count ?? 0}
              <span style={{ fontSize: 8, color: '#4a7055', marginLeft: 3 }}>studies</span>
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4a7055', textAlign: 'center' }}>
              {r?.completion_rate != null ? `${r.completion_rate.toFixed(0)}%` : '—'}
              <span style={{ fontSize: 8, color: '#4a7055', marginLeft: 2 }}>done</span>
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ffd700', textAlign: 'center' }}>
              {r && r.previous_study_count > 0 ? `~$${estEarned}` : '—'}
              <span style={{ fontSize: 8, color: '#9a7a00', marginLeft: 2 }}>earned</span>
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#4a7055', textAlign: 'right' }}>
              {r?.country ?? ''}
            </span>
          </div>
        );
      })()}
    </div>
  );
}
