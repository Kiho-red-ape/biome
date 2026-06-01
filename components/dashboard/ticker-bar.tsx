import type { Experiment } from '@/lib/types';

interface Props {
  experiments: Experiment[];
  totalPool: number;
  activeCount: number;
  totalParticipants: number;
}

// Seeded "recent completions" — stable demo activity
const RECENT = [
  { id: 'EXP-006', participants: 50,  pool: 2750  },
  { id: 'EXP-003', participants: 30,  pool: 1800  },
  { id: 'EXP-012', participants: 80,  pool: 6400  },
];

export function TickerBar({ experiments, totalPool, activeCount, totalParticipants }: Props) {
  const verifiedCount = experiments.filter((e) => e.is_verified).length;

  const items: Array<{ text: string }> = [
    { text: `${activeCount} studies live · $${(totalPool / 1000).toFixed(0)}K pool · ${totalParticipants} participants · ${verifiedCount} verified` },
    ...RECENT.map((r) => ({
      text: `${r.id} COMPLETED · ${r.participants} participants · $${r.pool.toLocaleString()} distributed`,
    })),
  ];

  const doubled = [...items, ...items];

  return (
    <div
      style={{
        height: 28,
        overflow: 'hidden',
        background: 'rgba(245,158,11,0.02)',
        borderBottom: '1px solid rgba(245,158,11,0.08)',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div
        className="ticker-track"
        style={{
          height: '100%',
          alignItems: 'center',
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              display: 'inline-flex',
              alignItems: 'center',
              height: '100%',
              paddingLeft: 24,
              paddingRight: 24,
              color: '#4a7055',
            }}
          >
            <TickerText text={item.text} />
            <span style={{ marginLeft: 24, color: 'rgba(245,158,11,0.12)' }}>|</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// Renders a ticker item with numbers highlighted in green
function TickerText({ text }: { text: string }) {
  const parts = text.split(/(\$[\d.,]+K?|\b[\d.,]+K?\b)/g);
  return (
    <>
      {parts.map((part, i) => {
        const isNumber = /^(\$[\d.,]+K?|[\d.,]+K?)$/.test(part);
        return (
          <span key={i} style={{ color: isNumber ? '#f59e0b' : undefined }}>
            {part}
          </span>
        );
      })}
    </>
  );
}
