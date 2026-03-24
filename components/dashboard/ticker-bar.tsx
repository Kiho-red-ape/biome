import type { Experiment } from '@/lib/types';

interface Props {
  experiments: Experiment[];
  totalPool: number;
  activeCount: number;
  totalParticipants: number;
}

// Seeded "recent completions" — stable demo activity
const RECENT = [
  { id: 'EXP-003', participants: 50,  pool: 2250  },
  { id: 'EXP-007', participants: 30,  pool: 1800  },
  { id: 'EXP-012', participants: 80,  pool: 6400  },
  { id: 'EXP-019', participants: 24,  pool: 720   },
  { id: 'EXP-024', participants: 100, pool: 15000 },
];

export function TickerBar({ experiments, totalPool, activeCount, totalParticipants }: Props) {
  const verifiedCount = experiments.filter((e) => e.is_verified).length;

  // Build items — numbers in green (#b7ff61), labels in #4a7055
  const items: Array<{ text: string }> = [
    { text: `EXPERIMENTS_LIVE : ${activeCount}` },
    { text: `TOTAL_POOL : $${(totalPool / 1000).toFixed(1)}K` },
    { text: `PARTICIPANTS : ${totalParticipants.toLocaleString()}` },
    { text: `VERIFIED : ${verifiedCount}` },
    { text: `STATUS : ● OPERATIONAL` },
    ...RECENT.map((r) => ({
      text: `${r.id} COMPLETED : ${r.participants} participants · $${(r.pool / 1000).toFixed(1)}K distributed`,
    })),
  ];

  const doubled = [...items, ...items];

  return (
    <div
      style={{
        height: 28,
        overflow: 'hidden',
        background: 'rgba(183,255,97,0.02)',
        borderBottom: '1px solid rgba(183,255,97,0.08)',
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
            {/* Render numbers in #b7ff61 */}
            <TickerText text={item.text} />
            <span style={{ marginLeft: 24, color: 'rgba(183,255,97,0.12)' }}>|</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// Renders a ticker item with numbers highlighted in green
function TickerText({ text }: { text: string }) {
  // Split on numbers (including decimals, K, $ prefixed)
  const parts = text.split(/(\$[\d.,]+K?|\b[\d.,]+K?\b)/g);
  return (
    <>
      {parts.map((part, i) => {
        const isNumber = /^(\$[\d.,]+K?|[\d.,]+K?)$/.test(part);
        return (
          <span key={i} style={{ color: isNumber ? '#b7ff61' : undefined }}>
            {part}
          </span>
        );
      })}
    </>
  );
}
