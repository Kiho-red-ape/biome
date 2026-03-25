import Link from 'next/link';
import { DEMO_EXPERIMENTS } from '@/lib/demo-data';

// ─── Types ────────────────────────────────────────────────────────────────────

type DemoState = 'applied' | 'review' | 'accepted' | 'active';

// ─── Demo participant ─────────────────────────────────────────────────────────

const DEMO_PARTICIPANT = {
  pseudonym:     'BioNomad_88',
  participant_id: 'P-7734-KILO',
  country:       'United States',
  reliability:   91.2,
  studies_done:  7,
};

const DEMO_STUDY = DEMO_EXPERIMENTS[0]; // Magnesium & Sleep

const DEMO_MILESTONES = [
  { week: 1, title: 'Baseline measurements & onboarding',           type: 'self_report',          status: 'completed' },
  { week: 2, title: 'Week 2 daily sleep log submission',            type: 'self_report',          status: 'completed' },
  { week: 3, title: 'Week 3 daily sleep log submission',            type: 'self_report',          status: 'completed' },
  { week: 4, title: 'Mid-study HRV check-in',                       type: 'experimenter_confirm', status: 'completed' },
  { week: 5, title: 'Week 5 daily sleep log submission',            type: 'self_report',          status: 'pending'   },
  { week: 6, title: 'Week 6 daily sleep log submission',            type: 'self_report',          status: 'pending'   },
  { week: 7, title: 'Week 7 check-in survey',                       type: 'self_report',          status: 'pending'   },
  { week: 8, title: 'Final data submission & study exit interview', type: 'experimenter_confirm', status: 'pending'   },
];

// ─── State card components ────────────────────────────────────────────────────

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="mono text-xs px-2.5 py-1 rounded"
      style={{ color, border: `1px solid ${color}40`, background: `${color}0a`, letterSpacing: '1px' }}
    >
      ● {label}
    </span>
  );
}

function Card({ children, accent = 'rgba(77,255,128,0.1)' }: { children: React.ReactNode; accent?: string }) {
  return (
    <div className="rounded overflow-hidden mb-6" style={{ border: `1px solid ${accent}` }}>
      {children}
    </div>
  );
}

function CardHeader({ label, color = 'var(--text-dim)', bg = 'var(--bg2)', children }: {
  label: string; color?: string; bg?: string; children?: React.ReactNode;
}) {
  return (
    <div className="px-5 py-3 flex items-center justify-between gap-3"
      style={{ background: bg, borderBottom: '1px solid rgba(77,255,128,0.06)' }}>
      <p className="mono text-xs" style={{ color }}>{label}</p>
      {children}
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>{label}</span>
      <span className="mono text-xs" style={{ color: color ?? 'var(--text-bright)' }}>{value}</span>
    </div>
  );
}

// ─── State A: Applied ─────────────────────────────────────────────────────────

function StateApplied() {
  return (
    <Card accent="rgba(77,255,128,0.1)">
      <CardHeader label="// STATE_A — APPLIED" color="var(--text-dim)" />
      <div className="px-5 py-5" style={{ background: 'var(--bg)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#eef4f0', marginBottom: 4 }}>
              {DEMO_STUDY.title}
            </p>
            <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
              Applied 2 days ago · {DEMO_STUDY.category}
            </p>
          </div>
          <StatusBadge label="APPLIED" color="var(--text-dim)" />
        </div>

        <div className="rounded p-4 mb-4" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.07)' }}>
          <p className="mono text-xs mb-3" style={{ color: 'var(--green)' }}>✓ Application received</p>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: '#aab8b1', lineHeight: 1.7 }}>
            You&apos;ll be notified when the experimenter reviews your application.
            You can track your application status here.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Row label="Eligibility screening" value="Eligible"   color="var(--green)" />
          <Row label="Reward"                value={`$${DEMO_STUDY.bounty_per_participant}`} color="var(--green)" />
          <Row label="Duration"              value={`${DEMO_STUDY.duration_weeks} weeks`} />
          <Row label="Format"                value="Remote only" />
        </div>
      </div>
    </Card>
  );
}

// ─── State B: Under Review ────────────────────────────────────────────────────

function StateReview() {
  return (
    <Card accent="rgba(255,179,0,0.15)">
      <CardHeader label="// STATE_B — UNDER REVIEW" color="var(--amber)" />
      <div className="px-5 py-5" style={{ background: 'var(--bg)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#eef4f0', marginBottom: 4 }}>
              {DEMO_STUDY.title}
            </p>
            <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
              Applied 5 days ago · Under experimenter review
            </p>
          </div>
          <StatusBadge label="REVIEWING" color="var(--amber)" />
        </div>

        <div className="rounded p-4 mb-4"
          style={{ background: 'rgba(255,179,0,0.04)', border: '1px solid rgba(255,179,0,0.15)' }}>
          <p className="mono text-xs mb-2" style={{ color: 'var(--amber)' }}>⏳ Awaiting experimenter decision</p>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: '#aab8b1', lineHeight: 1.7 }}>
            The experimenter is reviewing your application and eligibility screening results.
            You will receive a notification when a decision is made.
          </p>
        </div>

        <Row label="Quiz result"  value="Eligible"           color="var(--green)" />
        <Row label="Reliability"  value={`${DEMO_PARTICIPANT.reliability}/100`} color="var(--green)" />
        <Row label="Studies done" value={String(DEMO_PARTICIPANT.studies_done)} />
        <Row label="Region"       value={DEMO_PARTICIPANT.country} />
      </div>
    </Card>
  );
}

// ─── State C: Accepted / Enrolled ────────────────────────────────────────────

function StateAccepted() {
  return (
    <Card accent="rgba(0,229,255,0.2)">
      <CardHeader label="// STATE_C — ACCEPTED" color="var(--cyan)" />
      <div className="px-5 py-5" style={{ background: 'var(--bg)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#eef4f0', marginBottom: 4 }}>
              {DEMO_STUDY.title}
            </p>
            <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
              Accepted 1 day ago · Enrollment confirmed
            </p>
          </div>
          <StatusBadge label="APPROVED" color="var(--cyan)" />
        </div>

        {/* Experimenter message */}
        <div className="rounded p-4 mb-4"
          style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.18)' }}>
          <p className="mono text-xs mb-2" style={{ color: 'var(--cyan)' }}>
            ✉ Message from BIOME Research
          </p>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: '#aab8b1', lineHeight: 1.7, marginBottom: 12 }}>
            Congratulations — you&apos;ve been approved for the Magnesium Glycinate &amp; Sleep Architecture study.
            Please follow the onboarding link below to receive your supplement kit and confirm your wearable setup
            before the study begins on <strong style={{ color: 'var(--text-white)' }}>April 7, 2026</strong>.
          </p>
          <div className="flex items-center gap-2 p-2 rounded"
            style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.12)' }}>
            <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>Enrollment link:</span>
            <span className="mono text-xs" style={{ color: 'var(--cyan)' }}>
              https://biome.to/enroll/sleep-study-2026
            </span>
            <span className="mono text-xs ml-auto px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)', fontSize: 9 }}>
              HTTPS ✓
            </span>
          </div>
        </div>

        <Row label="Reward"   value={`$${DEMO_STUDY.bounty_per_participant}`} color="var(--green)" />
        <Row label="Starts"   value="April 7, 2026" />
        <Row label="Duration" value={`${DEMO_STUDY.duration_weeks} weeks`}   />
      </div>
    </Card>
  );
}

// ─── State D: In-Study ────────────────────────────────────────────────────────

function StateActive() {
  const completed = DEMO_MILESTONES.filter((m) => m.status === 'completed').length;
  const total     = DEMO_MILESTONES.length;
  const compliance = Math.round((completed / total) * 100);

  return (
    <Card accent="rgba(77,255,128,0.15)">
      <CardHeader label="// STATE_D — IN STUDY" color="var(--green)" />
      <div className="px-5 pt-4" style={{ background: 'var(--bg)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#eef4f0', marginBottom: 4 }}>
              {DEMO_STUDY.title}
            </p>
            <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
              Week 5 of {DEMO_STUDY.duration_weeks} · Active
            </p>
          </div>
          <StatusBadge label="ACTIVE" color="var(--cyan)" />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Compliance',   value: `${compliance}%`, color: compliance >= 80 ? 'var(--green)' : 'var(--amber)' },
            { label: 'Progress',     value: `W5/${DEMO_STUDY.duration_weeks}`, color: 'var(--cyan)' },
            { label: 'Milestones',   value: `${completed}/${total}`,           color: 'var(--text-white)' },
          ].map((s) => (
            <div key={s.label} className="rounded p-3"
              style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.07)' }}>
              <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)', fontSize: 9 }}>{s.label.toUpperCase()}</p>
              <p className="mono text-lg font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Milestone list (compact) */}
        <div className="flex flex-col gap-0 pb-4">
          {DEMO_MILESTONES.map((m, i) => {
            const isCurrent = m.status === 'pending' && i === completed;
            const isDone    = m.status === 'completed';
            return (
              <div key={i} className="flex items-center gap-3 py-2"
                style={{ borderBottom: i < DEMO_MILESTONES.length - 1 ? '1px solid rgba(77,255,128,0.04)' : 'none' }}>
                <span style={{
                  color:     isDone ? 'var(--green)' : isCurrent ? 'var(--cyan)' : 'var(--text-dim)',
                  fontSize:  13, flexShrink: 0,
                }}>
                  {isDone ? '✓' : isCurrent ? '→' : '○'}
                </span>
                <span className="mono text-xs flex-shrink-0" style={{ color: 'var(--text-dim)', minWidth: 48 }}>
                  W{m.week}
                </span>
                <span className="text-xs truncate" style={{
                  fontFamily: 'var(--font-heading)',
                  color:      isDone ? 'var(--text-dim)' : isCurrent ? 'var(--text-bright)' : 'var(--text-dim)',
                  fontWeight: isCurrent ? 600 : 400,
                }}>
                  {m.title}
                </span>
                {isCurrent && (
                  <span className="mono text-xs flex-shrink-0 ml-auto px-2 py-0.5 rounded"
                    style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)', fontSize: 9 }}>
                    DUE NOW
                  </span>
                )}
                {isDone && (
                  <span className="mono text-xs flex-shrink-0 ml-auto" style={{ color: 'var(--text-dim)', fontSize: 9 }}>done</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Payout status */}
        <div className="px-4 py-3 -mx-5 mt-0"
          style={{ background: 'rgba(77,255,128,0.04)', borderTop: '1px solid rgba(77,255,128,0.08)' }}>
          <Row label="Reward (on completion)" value={`$${DEMO_STUDY.bounty_per_participant}`} color="var(--green)" />
          <Row label="Payout status"          value="Pending — study in progress"             color="var(--text-dim)" />
          <Row label="Compliance threshold"   value="80% required"                             />
        </div>
      </div>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ParticipantDemoPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Nav */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 200,
        height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px',
        background: 'rgba(5,7,9,0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(183,255,97,0.12)',
      }}>
        <Link href="/demo" className="hover-green"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '2px' }}>
          ← Demo
        </Link>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '2px', color: '#4a7055' }}>
          // PARTICIPANT_DEMO
        </span>
      </header>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Header */}
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '3px',
          textTransform: 'uppercase', color: '#b7ff61', marginBottom: 8,
        }}>
          // PARTICIPANT_JOURNEY
        </p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 700, color: '#eef4f0', marginBottom: 8 }}>
          Participant Demo
        </h1>
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: '#7f8e87', lineHeight: 1.7, marginBottom: 40 }}>
          Demo participant: <strong style={{ color: 'var(--green)' }}>{DEMO_PARTICIPANT.pseudonym}</strong>
          {' '}({DEMO_PARTICIPANT.participant_id})<br />
          The four states below show the full participant journey through a BIOME study.
        </p>

        {/* Quick-jump */}
        <div className="flex flex-wrap gap-2 mb-10">
          {[
            { label: 'A: Applied',          href: '#applied'   },
            { label: 'B: Under Review',     href: '#review'    },
            { label: 'C: Accepted',         href: '#accepted'  },
            { label: 'D: In Study',         href: '#active'    },
          ].map((s) => (
            <a key={s.href} href={s.href}
              className="mono text-xs px-3 py-1.5 rounded transition-all"
              style={{
                border: '1px solid rgba(77,255,128,0.15)',
                color: 'var(--text-dim)',
                textDecoration: 'none',
              }}>
              {s.label}
            </a>
          ))}
          <Link href={`/experiments/${DEMO_STUDY.id}/apply`}
            className="mono text-xs px-3 py-1.5 rounded transition-all"
            style={{
              border: '1px solid rgba(183,255,97,0.3)',
              color: 'var(--green)',
              textDecoration: 'none',
              marginLeft: 'auto',
            }}>
            Try apply flow →
          </Link>
        </div>

        <div id="applied">   <StateApplied />   </div>
        <div id="review">    <StateReview />    </div>
        <div id="accepted">  <StateAccepted />  </div>
        <div id="active">    <StateActive />    </div>

        {/* Footer */}
        <div className="mt-8 p-4 rounded" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
          <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>// DEMO_LINKS</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/demo" className="mono text-xs" style={{ color: 'var(--green)' }}>← Demo org page</Link>
            <Link href="/demo/compliance/demo-exp-sleep" className="mono text-xs" style={{ color: 'var(--text-dim)' }}>Compliance demo →</Link>
            <Link href="/dashboard" className="mono text-xs" style={{ color: 'var(--text-dim)' }}>My dashboard →</Link>
          </div>
        </div>

      </div>
    </main>
  );
}
