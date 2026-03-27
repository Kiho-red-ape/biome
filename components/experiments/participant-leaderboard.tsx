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
        gridTemplateColumns: '44px 32px 1fr',
        alignItems: 'center',
        gap: '0 10px',
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

      {/* Info block */}
      <div style={{ overflow: 'hidden', minWidth: 0 }}>
        {/* Row 1: name + YOU badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
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
        {/* Row 2: reputation + studies + completion + est. earnings */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap', overflow: 'hidden' }}>
          {/* Reputation badge */}
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 8,
            textTransform: 'uppercase', letterSpacing: '1px',
            color: repColor,
            border: `1px solid ${repColor}40`,
            background: `${repColor}0a`,
            padding: '2px 5px',
            borderRadius: 2,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            {rep}
          </span>
          {/* Studies */}
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, color: '#aab8b1',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {row.previous_study_count} {row.previous_study_count === 1 ? 'study' : 'studies'}
          </span>
          {/* Completion rate */}
          {row.completion_rate != null && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: row.completion_rate >= 90 ? '#b7ff61' : '#4a7055',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {row.completion_rate.toFixed(0)}% done
            </span>
          )}
          {/* Estimated earnings */}
          {row.previous_study_count > 0 && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: '#ffd700', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              ~${estEarned} earned
            </span>
          )}
          {/* Country */}
          {row.country && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9,
              color: '#4a7055', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {row.country}
            </span>
          )}
        </div>
      </div>
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
        gridTemplateColumns: '44px 32px 1fr',
        gap: '0 10px',
        padding: '6px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        {['RANK', '', 'PARTICIPANT / STATS'].map((h) => (
          <span key={h} style={{
            fontFamily: 'var(--font-mono)', fontSize: 8,
            textTransform: 'uppercase', letterSpacing: '1.5px', color: '#4a7055',
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
      {authenticated && !userInTop5 && userRank >= 5 && (
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid rgba(183,255,97,0.1)',
          background: 'rgba(183,255,97,0.03)',
          borderLeft: '2px solid #b7ff61',
          display: 'grid',
          gridTemplateColumns: '44px 32px 1fr',
          gap: '0 10px',
          alignItems: 'center',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#b7ff61', fontWeight: 700 }}>
            #{userRank + 1}
          </span>
          <Identicon participantId={rows[userRank]?.participant_id ?? ''} size={28} />
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#b7ff61', display: 'block', marginBottom: 2 }}>
              You
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#4a7055' }}>
              {rows[userRank]?.previous_study_count ?? 0} studies
              {rows[userRank]?.completion_rate != null ? ` · ${rows[userRank].completion_rate!.toFixed(0)}% done` : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
