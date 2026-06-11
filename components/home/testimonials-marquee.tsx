import { Identicon } from '@/components/identicon';

const TESTIMONIALS = [
  {
    id:    'P-3KF8-2MNQ',
    name:  'CosmicNomad412',
    role:  'Participant',
    tag:   'First Study',
    quote: "I had no idea what to expect but the onboarding was really straightforward. Got my kit in 3 days and the instructions were clear. Completing it felt genuinely useful — like I actually contributed something real to science.",
  },
  {
    id:    'P-7JPS-9VQN',
    name:  'NeuralFalcon772',
    role:  'Participant',
    tag:   'Compensation',
    quote: "The payout landed within a week of completing the study. No chasing, no forms to fill out. That alone makes it worth doing again — most platforms make you wait months and then ghost you.",
  },
  {
    id:    'P-1LDT-4RWX',
    name:  'BioTrail88',
    role:  'Participant',
    tag:   'Contributing to Science',
    quote: "I signed up for a microbiome study and ended up learning more about my own gut health than I ever expected. The data they shared back with me was genuinely interesting. Felt like a two-way exchange.",
  },
  {
    id:    'R-8XCM-5FHZ',
    name:  'SilentMass_R',
    role:  'Researcher',
    tag:   'Study Operations',
    quote: "We ran a 60-participant supplement trial through Biome. From protocol submission to final data delivery, everything stayed on schedule. The compliance tracking alone saved us weeks of manual follow-up.",
  },
  {
    id:    'L-2QPB-6TNY',
    name:  'HelixNet_Lab',
    role:  'Lab Partner',
    tag:   'Lab Operations',
    quote: "The sample intake process was organized from the first shipment. Manifests arrived ahead of the kits, labeling was consistent, and study contacts were responsive. That's rare in this space.",
  },
  {
    id:    'P-5HVF-8KCE',
    name:  'ByteWolf201',
    role:  'Participant',
    tag:   'Remote Participation',
    quote: "I'm based in Dhaka and still got to participate in a European wearable study. The remote setup worked fine — check-ins were async, no scheduling stress. Honestly prefer it this way.",
  },
];

// Duplicate for seamless infinite loop
const ALL = [...TESTIMONIALS, ...TESTIMONIALS];

export function TestimonialsMarquee() {
  return (
    <section style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)', overflow: 'hidden' }}>
      <div style={{ padding: '64px 0 0' }}>
        <div style={{ padding: '0 24px', marginBottom: 40 }}>
          <span className="section-label section-label-dark">From the community</span>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize:   'clamp(22px, 3vw, 32px)',
            color:      'var(--ink)',
            lineHeight: 1.1,
          }}>
            Researchers. Participants. Partners.
          </h2>
        </div>
      </div>

      {/* Marquee track */}
      <div style={{ position: 'relative', paddingBottom: 64 }}>
        {/* Fade edges */}
        <div style={{
          position:   'absolute', top: 0, left: 0, bottom: 0, width: 80,
          background: 'linear-gradient(to right, var(--surface), transparent)',
          zIndex:     10, pointerEvents: 'none',
        }} />
        <div style={{
          position:   'absolute', top: 0, right: 0, bottom: 0, width: 80,
          background: 'linear-gradient(to left, var(--surface), transparent)',
          zIndex:     10, pointerEvents: 'none',
        }} />

        <div
          className="marquee-track"
          style={{
            display:   'flex',
            gap:       24,
            width:     'max-content',
            animation: 'marquee-scroll 40s linear infinite',
          }}
        >
          {ALL.map((t, i) => (
            <div
              key={`${t.id}-${i}`}
              style={{
                width:         340,
                flexShrink:    0,
                border:        '1px solid var(--border-soft)',
                boxShadow:     'var(--shadow-sm)',
                borderRadius:  'var(--radius)',
                background:    'var(--surface)',
                padding:       '24px',
                display:       'flex',
                flexDirection: 'column',
                gap:           16,
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                  <Identicon participantId={t.id} size={44} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily:  'var(--font-display)',
                    fontWeight:  600,
                    fontSize:    14,
                    color:       'var(--ink)',
                    lineHeight:  1.2,
                    overflow:    'hidden',
                    textOverflow:'ellipsis',
                    whiteSpace:  'nowrap',
                  }}>
                    {t.name}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                    <span style={{
                      fontFamily:    'var(--font-display)',
                      fontSize:      9,
                      fontWeight:    600,
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                      background:    t.role === 'Participant' ? 'var(--teal-soft)' : t.role === 'Researcher' ? 'var(--bg-page)' : 'var(--success-soft)',
                      color:         t.role === 'Participant' ? 'var(--teal-dark)' : t.role === 'Researcher' ? 'var(--slate)' : 'var(--success)',
                      padding:       '2px 6px',
                      border:        '1px solid var(--border-soft)',
                      borderRadius:  999,
                    }}>
                      {t.role}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize:   10,
                      color:      'var(--muted)',
                    }}>
                      {t.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quote */}
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize:   14,
                color:      'var(--slate)',
                lineHeight: 1.65,
                margin:     0,
                flex:       1,
              }}>
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Tag */}
              <div style={{
                paddingTop:  12,
                borderTop:   '1px solid var(--border-soft)',
                display:     'flex',
                alignItems:  'center',
                gap:         6,
              }}>
                <span style={{
                  fontFamily:    'var(--font-display)',
                  fontSize:      9,
                  fontWeight:    600,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  background:    'var(--teal-soft)',
                  color:         'var(--teal-dark)',
                  padding:       '2px 8px',
                  border:        '1px solid rgba(14,116,144,0.2)',
                  borderRadius:  999,
                }}>
                  {t.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-track:hover { animation-play-state: paused; }
      `}</style>
    </section>
  );
}
