'use client';

import Link from 'next/link';

// ─── Shared styles ─────────────────────────────────────────────────────────────

const PANEL: React.CSSProperties = {
  flex: 1,
  background: '#0b1014',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 2,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

const PANEL_HEADER: React.CSSProperties = {
  padding: '14px 18px 10px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
};

const MONO_LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  textTransform: 'uppercase' as const,
  letterSpacing: '2.5px',
};

const STUDY_ROW: React.CSSProperties = {
  padding: '11px 18px',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
};

// ─── Compliance bar ─────────────────────────────────────────────────────────────

function ComplianceBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
      <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.07)', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: color }} />
      </div>
      <span style={{ ...MONO_LABEL, fontSize: 8, color, letterSpacing: '1px' }}>{pct}%</span>
    </div>
  );
}

// ─── Stats footer row ──────────────────────────────────────────────────────────

function StatsFoot({ cols }: { cols: { label: string; value: string; color: string }[] }) {
  return (
    <div style={{
      display: 'flex',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(255,255,255,0.02)',
    }}>
      {cols.map((c, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            padding: '10px 18px',
            borderRight: i < cols.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}
        >
          <p style={{ ...MONO_LABEL, fontSize: 8, color: '#3d5040', marginBottom: 3 }}>{c.label}</p>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: c.color, margin: 0 }}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Participant panel ─────────────────────────────────────────────────────────

function ParticipantPanel() {
  return (
    <div style={PANEL}>
      {/* Column label */}
      <p style={{ ...MONO_LABEL, color: '#b7ff61', padding: '0 18px', marginBottom: 10, marginTop: 20 }}>
        FOR PARTICIPANTS
      </p>

      {/* Panel header */}
      <div style={PANEL_HEADER}>
        <span style={{ ...MONO_LABEL, fontSize: 10, color: '#3d5040' }}>// MY_STUDIES</span>
      </div>

      {/* Study rows */}
      <div style={{ flex: 1 }}>

        {/* Active study 1 */}
        <div style={STUDY_ROW}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#b7ff61', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600, color: '#e4f0e8' }}>
                Probiotic Diversity Study
              </span>
            </div>
            <span style={{ ...MONO_LABEL, fontSize: 8, color: '#ffb300', letterSpacing: '1px' }}>Week 3 of 8</span>
          </div>
          <ComplianceBar pct={83} color="#b7ff61" />
          <span style={{ ...MONO_LABEL, fontSize: 8, color: '#4a6050', letterSpacing: '1px', marginTop: 3, display: 'block' }}>On track</span>
        </div>

        {/* Active study 2 */}
        <div style={STUDY_ROW}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffb300', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600, color: '#e4f0e8' }}>
                Blue Light & Sleep RCT
              </span>
            </div>
            <span style={{ ...MONO_LABEL, fontSize: 8, color: '#ffb300', letterSpacing: '1px' }}>Week 1 of 4</span>
          </div>
          <ComplianceBar pct={25} color="#ffb300" />
          <span style={{ ...MONO_LABEL, fontSize: 8, color: '#4a6050', letterSpacing: '1px', marginTop: 3, display: 'block' }}>Just started</span>
        </div>

        {/* Completed study */}
        <div style={{ ...STUDY_ROW, borderBottom: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ ...MONO_LABEL, fontSize: 10, color: '#4a7055' }}>✓</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 500, color: '#6a8870' }}>
                Mediterranean Diet Study
              </span>
            </div>
            <span style={{ ...MONO_LABEL, fontSize: 8, color: '#4a7055', letterSpacing: '1px' }}>Completed</span>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
            <span style={{ ...MONO_LABEL, fontSize: 8, color: '#4a7055', letterSpacing: '1px' }}>96% compliance</span>
            <span style={{ ...MONO_LABEL, fontSize: 8, color: '#b7ff61', letterSpacing: '1px' }}>Paid $80.00</span>
          </div>
        </div>
      </div>

      {/* Stats footer */}
      <StatsFoot cols={[
        { label: 'Total Earned',  value: '$315.00', color: '#b7ff61' },
        { label: 'Completion',    value: '95%',     color: '#b7ff61' },
        { label: 'Eligible',      value: '8 studies', color: '#aab8b1' },
      ]} />

      {/* CTAs */}
      <div style={{ padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <Link
          href="/onboarding/participant"
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
            letterSpacing: '1.5px', color: '#070c07', background: '#b7ff61',
            padding: '8px 16px', textDecoration: 'none', display: 'inline-block',
          }}
        >
          Create profile →
        </Link>
        <Link
          href="/dashboard"
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
            letterSpacing: '1.5px', color: '#4a7055', textDecoration: 'none',
          }}
        >
          Learn more →
        </Link>
      </div>
    </div>
  );
}

// ─── Experimenter panel ────────────────────────────────────────────────────────

function ExperimenterPanel() {
  return (
    <div style={PANEL}>
      {/* Column label */}
      <p style={{ ...MONO_LABEL, color: '#8ee7ff', padding: '0 18px', marginBottom: 10, marginTop: 20 }}>
        FOR RESEARCHERS
      </p>

      {/* Panel header */}
      <div style={PANEL_HEADER}>
        <span style={{ ...MONO_LABEL, fontSize: 10, color: '#3d5060' }}>// MY_STUDIES</span>
      </div>

      {/* Study rows */}
      <div style={{ flex: 1 }}>

        {/* Active study */}
        <div style={STUDY_ROW}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600, color: '#e4f0e8' }}>
              Ashwagandha & Cortisol Study
            </span>
            <span style={{ ...MONO_LABEL, fontSize: 8, color: '#8ee7ff', letterSpacing: '1px' }}>● ACTIVE</span>
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <span style={{ ...MONO_LABEL, fontSize: 8, color: '#4a7055', letterSpacing: '1px' }}>Enrolled: 48/50</span>
            <span style={{ ...MONO_LABEL, fontSize: 8, color: '#b7ff61', letterSpacing: '1px' }}>Avg compliance: 87%</span>
          </div>
          <span style={{ ...MONO_LABEL, fontSize: 8, color: '#ffb300', letterSpacing: '1px', marginTop: 3, display: 'block' }}>
            3 pending verifications
          </span>
        </div>

        {/* Recruiting study */}
        <div style={STUDY_ROW}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600, color: '#e4f0e8' }}>
              Prebiotic Fiber Study
            </span>
            <span style={{ ...MONO_LABEL, fontSize: 8, color: '#b7ff61', letterSpacing: '1px' }}>● RECRUITING</span>
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <span style={{ ...MONO_LABEL, fontSize: 8, color: '#4a7055', letterSpacing: '1px' }}>Applications: 24</span>
            <span style={{ ...MONO_LABEL, fontSize: 8, color: '#4a7055', letterSpacing: '1px' }}>Screened: 18</span>
          </div>
          <span style={{ ...MONO_LABEL, fontSize: 8, color: '#4a6050', letterSpacing: '1px', marginTop: 3, display: 'block' }}>
            12 approved · 6 waitlisted
          </span>
        </div>

        {/* Completed study */}
        <div style={{ ...STUDY_ROW, borderBottom: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 500, color: '#6a8870' }}>
              CGM Fasting Study
            </span>
            <span style={{ ...MONO_LABEL, fontSize: 8, color: '#4a7055', letterSpacing: '1px' }}>✓ COMPLETED</span>
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <span style={{ ...MONO_LABEL, fontSize: 8, color: '#4a7055', letterSpacing: '1px' }}>45 participants</span>
            <span style={{ ...MONO_LABEL, fontSize: 8, color: '#4a7055', letterSpacing: '1px' }}>Avg compliance: 91%</span>
          </div>
          <span style={{ ...MONO_LABEL, fontSize: 8, color: '#8ee7ff', letterSpacing: '1px', marginTop: 3, display: 'block' }}>
            Payout: $2,700 distributed
          </span>
        </div>
      </div>

      {/* Stats footer */}
      <StatsFoot cols={[
        { label: 'Total Studies',  value: '3',      color: '#8ee7ff' },
        { label: 'Participants',   value: '143',    color: '#8ee7ff' },
        { label: 'Pool',           value: '$6,200', color: '#b7ff61' },
      ]} />

      {/* CTAs */}
      <div style={{ padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <Link
          href="/post"
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
            letterSpacing: '1.5px', color: '#070c07', background: '#b7ff61',
            padding: '8px 16px', textDecoration: 'none', display: 'inline-block',
          }}
        >
          Post a study →
        </Link>
        <Link
          href="/onboarding?role=experimenter"
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
            letterSpacing: '1.5px', color: '#4a7055', textDecoration: 'none',
          }}
        >
          Learn more →
        </Link>
      </div>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────

export function Leaderboard() {
  return (
    <section style={{ padding: '0 40px 40px' }}>

      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 40, marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '3px',
          textTransform: 'uppercase', color: '#b7ff61', whiteSpace: 'nowrap', flexShrink: 0 }}>
          // CONTROL_CENTER
        </span>
        <div style={{ flex: 1, height: 1, background: '#b7ff61', opacity: 0.15 }} />
      </div>

      <p style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: '#4a6050',
        marginBottom: 24, lineHeight: 1.5, maxWidth: 560 }}>
        Everything you need — whether you&apos;re participating or running a study.
      </p>

      {/* Screenshot window wrapper */}
      <div style={{
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)',
        background: '#0b1014',
      }}>
        {/* Title bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 16px',
          background: 'linear-gradient(180deg, #1a2020 0%, #141c1a 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          {/* Traffic lights */}
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57', display: 'inline-block', boxShadow: '0 0 0 0.5px rgba(0,0,0,0.4)' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e', display: 'inline-block', boxShadow: '0 0 0 0.5px rgba(0,0,0,0.4)' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840', display: 'inline-block', boxShadow: '0 0 0 0.5px rgba(0,0,0,0.4)' }} />
          {/* Window title */}
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, color: '#3d5040',
            letterSpacing: '2px', textTransform: 'uppercase', marginLeft: 'auto', marginRight: 'auto',
          }}>
            biome.to — control_center
          </span>
          {/* Spacer to balance traffic lights */}
          <span style={{ width: 48 }} />
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'flex', gap: 0 }}>
          <div style={{ flex: 1, borderRight: '1px solid rgba(255,255,255,0.05)' }}>
            <ParticipantPanel />
          </div>
          <div style={{ flex: 1 }}>
            <ExperimenterPanel />
          </div>
        </div>
      </div>

    </section>
  );
}
