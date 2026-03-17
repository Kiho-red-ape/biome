import Link from 'next/link';
import { Identicon } from '@/components/identicon';
import { reputationBadge, countryFlag } from '@/lib/utils/profile';

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

// ─── Component ────────────────────────────────────────────────────────────────

export function Leaderboard({ leaders }: Props) {
  if (leaders.length === 0) {
    return (
      <section className="px-4 md:px-6 pb-16">
        <div className="flex items-center gap-3 mb-5">
          <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
            // TOP_PARTICIPANTS
          </p>
        </div>
        <div
          className="rounded py-12 text-center"
          style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}
        >
          <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
            // LEADERBOARD_EMPTY — complete 3+ experiments to appear here
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 md:px-6 pb-16">

      {/* Header */}
      <div className="flex items-end justify-between pt-8 pb-5 border-t" style={{ borderColor: 'rgba(77,255,128,0.07)' }}>
        <div>
          <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>
            // TOP_PARTICIPANTS
          </p>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            Ranked by reliability across completed experiments
          </p>
        </div>
        <p className="mono text-xs hidden md:block" style={{ color: 'var(--text-dim)' }}>
          min. 3 experiments to qualify
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded" style={{ border: '1px solid rgba(77,255,128,0.07)' }}>
        <table className="w-full border-collapse" style={{ minWidth: 600 }}>

          <thead>
            <tr style={{ background: 'var(--bg2)', borderBottom: '1px solid rgba(77,255,128,0.08)' }}>
              {['#', 'PARTICIPANT', 'COUNTRY', 'STUDIES', 'RATE', 'SCORE', 'REPUTATION'].map((h) => (
                <th
                  key={h}
                  className="mono text-xs font-normal px-3 py-3 text-left whitespace-nowrap"
                  style={{ color: 'var(--text-dim)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {leaders.map((p, i) => {
              const rank  = i + 1;
              const badge = reputationBadge(p.completion_rate);
              const isTop = rank === 1;

              return (
                <tr
                  key={p.participant_id}
                  style={{
                    borderBottom: '1px solid rgba(77,255,128,0.05)',
                    background: isTop ? 'rgba(77,255,128,0.03)' : 'transparent',
                    boxShadow: isTop ? 'inset 0 0 0 1px rgba(77,255,128,0.06)' : 'none',
                    opacity: rank > 3 ? 0.85 : 1,
                  }}
                >
                  {/* Rank */}
                  <td className="px-3 py-3 mono text-xs tabular-nums w-10" style={{ color: rank <= 3 ? 'var(--green)' : 'var(--text-dim)' }}>
                    {rank <= 3 ? `#${rank}` : String(rank).padStart(2, '0')}
                  </td>

                  {/* Participant */}
                  <td className="px-3 py-3">
                    <Link
                      href={`/profile/${p.participant_id}`}
                      className="flex items-center gap-2.5 no-underline group"
                    >
                      <Identicon participantId={p.participant_id} size={32} />
                      <div>
                        <p
                          className="text-sm font-semibold leading-tight group-hover:underline"
                          style={{ color: 'var(--text-bright)' }}
                        >
                          {p.pseudonym}
                        </p>
                        <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                          {p.participant_id}
                        </p>
                      </div>
                    </Link>
                  </td>

                  {/* Country */}
                  <td className="px-3 py-3 text-sm" style={{ color: 'var(--text-dim)' }}>
                    {countryFlag(p.country)} {p.country}
                  </td>

                  {/* Studies */}
                  <td className="px-3 py-3 mono text-xs tabular-nums" style={{ color: 'var(--text-bright)' }}>
                    {p.previous_study_count}
                  </td>

                  {/* Completion rate */}
                  <td className="px-3 py-3 mono text-xs tabular-nums" style={{ color: 'var(--text-bright)' }}>
                    {p.completion_rate.toFixed(0)}%
                  </td>

                  {/* Reliability score */}
                  <td className="px-3 py-3 mono text-sm tabular-nums font-bold" style={{ color: isTop ? 'var(--green)' : 'var(--text-bright)' }}>
                    {p.reliability_score.toFixed(1)}
                  </td>

                  {/* Reputation badge */}
                  <td className="px-3 py-3">
                    <span className="mono text-xs" style={{ color: badge.color }}>
                      {badge.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>

        </table>
      </div>
    </section>
  );
}
