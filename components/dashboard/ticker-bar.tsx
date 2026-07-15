import type { Experiment } from '@/lib/types';

interface Props {
  experiments: Experiment[];
  totalPool: number;
  activeCount: number;
  totalParticipants: number;
}

// Seeded "recent completions" — stable demo activity
const RECENT = [
  { id: 'EXP-006', partners: 50,  pool: 2750  },
  { id: 'EXP-003', partners: 30,  pool: 1800  },
  { id: 'EXP-012', partners: 80,  pool: 6400  },
];

export function TickerBar({ experiments, totalPool, activeCount, totalParticipants }: Props) {
  const verifiedCount = experiments.filter((e) => e.is_verified).length;

  const items: Array<{ text: string }> = [
    { text: `${activeCount} studies live · $${(totalPool / 1000).toFixed(0)}K pool · ${totalParticipants} research partners · ${verifiedCount} verified` },
    ...RECENT.map((r) => ({
      text: `${r.id} COMPLETED · ${r.partners} research partners · $${r.pool.toLocaleString()} distributed`,
    })),
  ];

  const doubled = [...items, ...items];

  return (
    <div
      style={{
        height:      28,
        overflow:    'hidden',
        background:  'var(--teal-faint)',
        borderBottom: '1px solid var(--border-soft)',
        position:    'relative',
        zIndex:      2,
      }}
    >
      <div
        className="ticker-track"
        style={{
          height:     '100%',
          alignItems: 'center',
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      10,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              display:       'inline-flex',
              alignItems:    'center',
              height:        '100%',
              paddingLeft:   24,
              paddingRight:  24,
              color:         'var(--slate)',
            }}
          >
            <TickerText text={item.text} />
            <span style={{ marginLeft: 24, color: 'var(--border-mid)' }}>|</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// Renders a ticker item with numbers highlighted in teal
function TickerText({ text }: { text: string }) {
  const parts = text.split(/(\$[\d.,]+K?|\b[\d.,]+K?\b)/g);
  return (
    <>
      {parts.map((part, i) => {
        const isNumber = /^(\$[\d.,]+K?|[\d.,]+K?)$/.test(part);
        return (
          <span key={i} style={{ color: isNumber ? 'var(--teal)' : undefined }}>
            {part}
          </span>
        );
      })}
    </>
  );
}
