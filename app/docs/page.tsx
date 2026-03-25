// BIOME Docs landing page.
// Deep-links from footer and CTA block guide users to the right section.

import Link from 'next/link';

type DocSection = {
  id: string;
  label: string;
  title: string;
  description: string;
  items: string[];
  cta?: { label: string; href: string };
};

const SECTIONS: DocSection[] = [
  {
    id:    'what-is-biome',
    label: '01 — OVERVIEW',
    title: 'What is BIOME?',
    description:
      'BIOME is a bounty-based experiment aggregator — the CoinGecko of scientific experiments. ' +
      'Anyone can post an experiment (bounty), participants sign up and earn. ' +
      'BIOME takes a platform fee and offers an optional BIOME Verified credential for vetted studies.',
    items: [
      'Browse open studies on the dashboard',
      'Sign up as a participant and earn bounties',
      'Post your own study as an experimenter',
      'Get your study BIOME Verified for higher trust',
    ],
  },
  {
    id:    'participants',
    label: '02 — PARTICIPANTS',
    title: 'How to participate',
    description:
      'Participants discover studies, apply, and earn bounties by completing study tasks. ' +
      'Your profile, eligibility quiz results, and reliability score are used by experimenters to screen applicants.',
    items: [
      'Create your participant profile (demographics, devices, research history)',
      'Browse open studies — filter by category, reward, remote/in-person, status',
      'Click a study → review eligibility criteria and protocol',
      'Apply: answer the optional eligibility quiz, review the study summary, and submit',
      'Wait for experimenter approval — track status in your dashboard',
      'Once enrolled: complete weekly milestones and self-report tasks',
      'Maintain compliance threshold (typically 80%) to receive your payout',
      'Payout is processed after the experimenter confirms completion',
    ],
    cta: { label: 'Browse open studies →', href: '/experiments' },
  },
  {
    id:    'researchers',
    label: '03 — RESEARCHERS',
    title: 'How to run a study',
    description:
      'Experimenters post studies, set a bounty pool, define eligibility criteria, build a milestone protocol, ' +
      'and screen applicants through the BIOME dashboard.',
    items: [
      'Sign up as an experimenter and complete your organisation profile',
      'Post a study: title, description, category, bounty per participant, total budget, slots, duration',
      'Define eligibility criteria (inclusion / exclusion) and optional yes/no screening quiz',
      'Set application deadline and publish date',
      'BIOME Verification: optional paid credential ($1K) for vetted, badged studies',
      'Screen applicants via the dashboard: view reliability scores, eligibility, history',
      'Approve, waitlist, or deny applicants — approved applicants fill slots',
      'Commence the study: milestones auto-generate for enrolled participants',
      'Monitor compliance, verify submitted milestones, and confirm completions',
      'Trigger payouts once completion is confirmed',
    ],
    cta: { label: 'Post a study →', href: '/post' },
  },
  {
    id:    'screening',
    label: '04 — SCREENING',
    title: 'Applicant screening',
    description:
      'The screening dashboard shows all applicants for a study with eligibility, reliability score, ' +
      'and application history. Slot counts reflect approved applicants only.',
    items: [
      'Eligibility: cross-checked against age, region, device, and quiz answers',
      'Reliability: participant track record from previous studies (completion rate, milestone consistency)',
      'Quiz results: experimenter-configured yes/no questions sent with each application',
      'Actions: Approve (fills a slot), Waitlist (no slot consumed), Deny',
      'Approved count = slots filled — applied/waitlisted do not consume slots',
    ],
  },
  {
    id:    'milestones',
    label: '05 — MILESTONES',
    title: 'Milestones and compliance',
    description:
      'Studies are broken into weekly milestones. Each milestone is either self-reported by the participant ' +
      'or confirmed by the experimenter. Compliance is calculated as the percentage of milestones completed.',
    items: [
      'Self-report milestones: participant submits evidence / confirms completion',
      'Experimenter-confirm milestones: experimenter verifies the submission',
      'Compliance score = completed milestones ÷ total milestones × 100',
      'Minimum compliance threshold (default 80%) must be met for payout eligibility',
      'Missed or rejected milestones reduce the compliance score',
    ],
  },
  {
    id:    'payouts',
    label: '06 — PAYOUTS',
    title: 'Payouts and fees',
    description:
      'BIOME processes payouts after study completion. See the full Payout Policy for details on ' +
      'eligibility, timing, methods, and fees.',
    items: [
      'Payout eligibility: approved, enrolled, compliance threshold met',
      'Payout timing: varies by method and provider processing',
      'Payout methods: bank transfer, digital payout methods, crypto (where available)',
      'Participant processing fee: 0.5% of payout amount',
      'Platform fee: charged to experimenters — not deducted from participant rewards',
    ],
    cta: { label: 'Payout policy →', href: '/payout-policy' },
  },
];

export default function DocsPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        <Link href="/" style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '2px',
          color: '#4a7055', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← BIOME
        </Link>

        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '3px',
          textTransform: 'uppercase', color: '#b7ff61', marginBottom: 8,
        }}>
          // BIOME_DOCS
        </p>
        <h1 style={{
          fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 700,
          color: '#eef4f0', marginBottom: 8,
        }}>
          BIOME Documentation
        </h1>
        <p style={{
          fontFamily: 'var(--font-heading)', fontSize: 15, color: '#7f8e87',
          lineHeight: 1.7, marginBottom: 40,
        }}>
          Everything you need to participate in or run a study on BIOME.
        </p>

        {/* Quick nav */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 48 }}>
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '1px',
                color: '#4a7055', textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.07)',
                padding: '4px 10px',
              }}
            >
              {s.label}
            </a>
          ))}
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          {SECTIONS.map((s) => (
            <div key={s.id} id={s.id}>
              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '2px',
                textTransform: 'uppercase', color: '#4a7055', marginBottom: 8,
              }}>
                // {s.label}
              </p>
              <h2 style={{
                fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700,
                color: '#eef4f0', marginBottom: 12,
              }}>
                {s.title}
              </h2>
              <p style={{
                fontFamily: 'var(--font-heading)', fontSize: 15, color: '#aab8b1',
                lineHeight: 1.75, marginBottom: 16,
              }}>
                {s.description}
              </p>
              <ul style={{
                fontFamily: 'var(--font-heading)', fontSize: 14, color: '#7f8e87',
                lineHeight: 1.75, paddingLeft: 20, marginBottom: s.cta ? 16 : 0,
              }}>
                {s.items.map((item, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>{item}</li>
                ))}
              </ul>
              {s.cta && (
                <Link
                  href={s.cta.href}
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    color: '#b7ff61', textDecoration: 'none', letterSpacing: '0.5px',
                  }}
                >
                  {s.cta.label}
                </Link>
              )}
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
