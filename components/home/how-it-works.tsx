import { BrutalistIcon } from '@/components/icons/BrutalistIcon';

const CARDS = [
  { num: '01', icon: 'recruit'  as const, title: 'Recruit',  desc: 'Targeted cohort. Screened to your criteria.'             },
  { num: '02', icon: 'collect'  as const, title: 'Collect',  desc: 'Kits to doorstep. Samples tracked to lab.'               },
  { num: '03', icon: 'track'    as const, title: 'Track',    desc: 'Milestone compliance. Dropout alerts. Weekly reports.'    },
  { num: '04', icon: 'pay'      as const, title: 'Pay',      desc: 'Compensation on completion. Full audit trail.'            },
  { num: '05', icon: 'deliver'  as const, title: 'Deliver',  desc: 'Structured data export. Chain-of-custody included.'      },
];

export function HowItWorks() {
  return (
    <section style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)' }}>
      <div className="section-inner">
        <span className="section-label section-label-dark">How it works</span>
        <h2 style={{
          fontFamily:   'var(--font-display)',
          fontSize:     'var(--text-h2)',
          color:        'var(--ink)',
          marginBottom: 44,
        }}>
          Five steps. One platform.
        </h2>

        <div
          style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap:                 24,
          }}
          className="how-grid"
        >
          {CARDS.map((card) => (
            <div key={card.num} className="brutalist-card" style={{ background: 'var(--off-white)' }}>
              <span className="card-number-bg">{card.num}</span>
              <div style={{ marginBottom: 20 }}>
                <BrutalistIcon name={card.icon} size={48} color="var(--black)" strokeWidth={2.5} />
              </div>
              <h3 style={{
                fontFamily:   'var(--font-display)',
                fontSize:     22,
                fontWeight:   600,
                color:        'var(--black)',
                marginBottom: 10,
              }}>
                {card.title}
              </h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--gray)', margin: 0, lineHeight: 1.5 }}>
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .how-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .how-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
