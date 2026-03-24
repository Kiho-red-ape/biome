import type { Experiment } from '@/lib/types';

interface Props {
  experiments: Experiment[];
  totalPool: number;
  activeCount: number;
  totalParticipants: number;
}

// Seeded "recent completions" — stable fake activity for demo
const RECENT = [
  { id: 'EXP-003', participants: 50,  pool: 2250  },
  { id: 'EXP-007', participants: 30,  pool: 1800  },
  { id: 'EXP-012', participants: 80,  pool: 6400  },
  { id: 'EXP-019', participants: 24,  pool: 720   },
  { id: 'EXP-024', participants: 100, pool: 15000 },
];

export function TickerBar({ experiments, totalPool, activeCount, totalParticipants }: Props) {
  const verifiedCount = experiments.filter((e) => e.is_verified).length;
  const completedCount = experiments.filter((e) => e.status === 'completed').length;

  const items = [
    { label: '// BIOME PROTOCOL v0.1',   value: null,                                     color: 'var(--text-dim)' },
    { label: 'EXPERIMENTS_LIVE',          value: String(activeCount),                       color: 'var(--green)'   },
    { label: 'TOTAL_POOL',               value: `$${(totalPool / 1000).toFixed(1)}K`,      color: 'var(--green)'   },
    { label: 'PARTICIPANTS',             value: String(totalParticipants),                  color: 'var(--cyan)'    },
    { label: 'VERIFIED',                 value: String(verifiedCount),                      color: 'var(--green)'   },
    { label: 'COMPLETED_STUDIES',        value: String(completedCount),                     color: 'var(--text-dim)'},
    { label: 'STATUS',                   value: '● OPERATIONAL',                            color: 'var(--green)'   },
    // Seeded recent completions
    ...RECENT.map((r) => ({
      label: `${r.id} COMPLETED`,
      value: `${r.participants} participants · $${r.pool.toLocaleString()} distributed`,
      color: 'var(--text-dim)',
    })),
  ];

  const doubled = [...items, ...items];

  return (
    <div
      className="w-full overflow-hidden"
      style={{
        background: 'var(--bg2)',
        borderBottom: '1px solid rgba(77,255,128,0.08)',
        height: '28px',
      }}
    >
      <div className="ticker-track h-full items-center">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="mono text-xs inline-flex items-center gap-2 px-5 h-full"
            style={{ color: 'var(--text-dim)' }}
          >
            <span>{item.label}</span>
            {item.value && (
              <>
                <span style={{ color: 'rgba(77,255,128,0.2)' }}>:</span>
                <span style={{ color: item.color }}>{item.value}</span>
              </>
            )}
            <span style={{ color: 'rgba(77,255,128,0.15)', marginLeft: '12px' }}>|</span>
          </span>
        ))}
      </div>
    </div>
  );
}
