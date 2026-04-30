const STEPS = [
  {
    num: '01',
    label: 'RECRUIT',
    desc: 'Targeted recruitment campaigns built per study.\nEligibility screening. Verified enrollment.',
  },
  {
    num: '02',
    label: 'COLLECT',
    desc: 'Sample kits shipped to participants.\nStool, saliva, blood spot, wearable data.\nPartner phlebotomy for venipuncture.',
  },
  {
    num: '03',
    label: 'TRACK',
    desc: 'Milestone-based compliance monitoring.\nAutomated reminders. Dropout flagging.\nWeekly sponsor reports.',
  },
  {
    num: '04',
    label: 'PAY',
    desc: 'Stripe Connect payouts to 220+ countries.\nCompliance-gated. Full audit trail.\nTransparent pass-through, no CRO markup.',
  },
  {
    num: '05',
    label: 'DELIVER',
    desc: 'Structured data export with chain-of-custody.\nConsent records. Communication logs.\nOperational audit bundle at close.',
  },
];

export function HowItWorks() {
  return (
    <section
      style={{ paddingTop: 96, paddingBottom: 96, maxWidth: 900, margin: '0 auto' }}
      className="px-4 sm:px-6 lg:px-10"
    >
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px',
        color: '#b7ff61', textTransform: 'uppercase', marginBottom: 48,
      }}>
        // HOW_IT_WORKS
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {STEPS.map((step, i) => (
          <div
            key={step.num}
            style={{
              display:      'grid',
              gridTemplateColumns: '80px 1fr',
              gap:          32,
              paddingTop:   32,
              paddingBottom: 32,
              borderTop:    i === 0 ? '1px solid rgba(255,255,255,0.06)' : undefined,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              alignItems:   'start',
            }}
          >
            {/* Number + label */}
            <div style={{ flexShrink: 0 }}>
              <div style={{
                fontFamily:  'var(--font-heading)',
                fontWeight:  700,
                fontSize:    56,
                lineHeight:  1,
                color:       'rgba(183,255,97,0.15)',
                marginBottom: 4,
              }}>
                {step.num}
              </div>
              <div style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      10,
                letterSpacing: '3px',
                color:         '#b7ff61',
                textTransform: 'uppercase',
              }}>
                {step.label}
              </div>
            </div>

            {/* Description */}
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize:   13,
              color:      '#aab8b1',
              lineHeight: 1.8,
              maxWidth:   480,
              whiteSpace: 'pre-line',
              paddingTop: 8,
            }}>
              {step.desc}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
