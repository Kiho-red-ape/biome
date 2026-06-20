'use client';

export const dynamic = 'force-dynamic';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { SiteHeader } from '@/components/nav/header';

// ─── Constants ──────────────────────────────────────────────────────────────

const DEMO_OWNER_EMAIL = 'kishore@biome.to';
const CONTACT_EMAIL = 'contact@biome.to';

type Role = 'researcher' | 'partner-participant' | 'partner-org';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)' };

// ─── Flow definitions ───────────────────────────────────────────────────────

type Step = {
  title: string;
  desc: string;
  preview: React.ReactNode;
};

type Flow = {
  role: Role;
  eyebrow: string;
  title: string;
  blurb: string;
  steps: Step[];
  cta: { label: string; href: string };
  onboard: {
    headline: string;
    desc: string;
    invites: { label: string; path: string }[];
  };
};

// ─── Shared preview primitives ──────────────────────────────────────────────

function MiniCard({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div style={{
      background:   'var(--surface)',
      border:       '1px solid var(--border-soft)',
      borderTop:    accent ? '2px solid var(--teal)' : '1px solid var(--border-soft)',
      borderRadius: 'var(--radius-sm)',
      boxShadow:    'var(--shadow-sm)',
      overflow:     'hidden',
    }}>
      {children}
    </div>
  );
}

function MiniLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding:       '8px 14px',
      borderBottom:  '1px solid var(--border-soft)',
      background:    'var(--bg-page)',
      ...MONO,
      fontSize:      9,
      fontWeight:    600,
      letterSpacing: '1.5px',
      textTransform: 'uppercase',
      color:         'var(--slate)',
    }}>
      {children}
    </div>
  );
}

function Pill({ children, bg, color }: { children: React.ReactNode; bg: string; color: string }) {
  return (
    <span style={{
      ...MONO, fontSize: 9, fontWeight: 700, letterSpacing: '1px',
      textTransform: 'uppercase', background: bg, color, borderRadius: 4, padding: '2px 7px',
      display: 'inline-block',
    }}>
      {children}
    </span>
  );
}

function StatRow({ items }: { items: { label: string; value: string; sub?: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
      {items.map((m, i) => (
        <div key={m.label} style={{
          padding: '12px 14px',
          borderRight: i < items.length - 1 ? '1px solid var(--border-soft)' : 'none',
        }}>
          <div style={{ ...MONO, fontSize: 9, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>
            {m.label}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 17, color: 'var(--ink)', lineHeight: 1 }}>
            {m.value}
          </div>
          {m.sub && (
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>
              {m.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ListRow({
  left, right, sub,
}: { left: string; right?: React.ReactNode; sub?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 10, padding: '11px 14px', borderBottom: '1px solid var(--border-soft)',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {left}
        </div>
        {sub && (
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            {sub}
          </div>
        )}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  );
}

// ─── Flow data ──────────────────────────────────────────────────────────────

const FLOWS: Flow[] = [
  // ── Researcher ────────────────────────────────────────────────────────────
  {
    role:    'researcher',
    eyebrow: 'Researcher',
    title:   'Run a study on your terms',
    blurb:   'You bring the protocol. Biome supplies the operations — recruitment, screening, tracking, compliance, and compensation — so you can run it independently.',
    cta:     { label: 'Open a real researcher dashboard →', href: '/dashboard/experiments' },
    steps: [
      {
        title: 'Get an estimate',
        desc:  'Size your study before you commit. The estimator turns cohort size, duration, and sample logistics into a clear cost picture.',
        preview: (
          <MiniCard accent>
            <MiniLabel>Cost estimator · illustrative</MiniLabel>
            <StatRow items={[
              { label: 'Cohort',   value: '120',   sub: 'research partners' },
              { label: 'Duration', value: '8 wks',  sub: 'tracked' },
              { label: 'Estimate', value: '—',      sub: 'shown after inputs' },
            ]} />
          </MiniCard>
        ),
      },
      {
        title: 'Submit intake / post study',
        desc:  'A short intake captures your protocol, eligibility, and milestones. No long forms — publish straight to your study dashboard.',
        preview: (
          <MiniCard>
            <MiniLabel>New study · draft</MiniLabel>
            <ListRow left="Gut microbiome & sleep cohort" sub="Category: Microbiome" right={<Pill bg="var(--bg-page)" color="var(--muted)">Draft</Pill>} />
            <ListRow left="Eligibility: adults 25–55, India" sub="Screening criteria attached" />
            <div style={{ padding: '11px 14px' }}>
              <ListRow left="6 milestones · weekly self-report" />
            </div>
          </MiniCard>
        ),
      },
      {
        title: 'Deposit budget',
        desc:  'Fund the compensation pool upfront so research partners know the study is real. Held against verified milestone completion.',
        preview: (
          <MiniCard>
            <MiniLabel>Budget · sample data</MiniLabel>
            <StatRow items={[
              { label: 'Per partner', value: '$60',     sub: 'on completion' },
              { label: 'Pool',        value: '$7,200',  sub: '120 slots' },
              { label: 'Status',      value: 'Funded',  sub: 'escrow' },
            ]} />
          </MiniCard>
        ),
      },
      {
        title: 'Recruit',
        desc:  'OME, the recruitment intelligence at /ome, locates hospitals, labs, and clinics across India and guides compliant data access so your cohort fills fast.',
        preview: (
          <MiniCard>
            <MiniLabel>OME · recruitment intelligence</MiniLabel>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ ...MONO, fontSize: 9, fontWeight: 700, color: '#fff', background: 'var(--teal)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>OME</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink)', lineHeight: 1.5 }}>
                  Found 7 hospitals in Bengaluru suited to stool-sample recruitment, with ABDM-compliant access notes for each.
                </span>
              </div>
              <Link href="/ome" style={{ ...MONO, fontSize: 11, fontWeight: 700, color: 'var(--teal-dark)', textDecoration: 'none' }}>
                Open OME →
              </Link>
            </div>
          </MiniCard>
        ),
      },
      {
        title: 'Screen applicants',
        desc:  'Review applications against your eligibility criteria and approve the cohort you want. You stay in control of who joins.',
        preview: (
          <MiniCard>
            <MiniLabel>Applicants · sample data</MiniLabel>
            <ListRow left="P-4821 · adults 25–55" sub="Eligibility: passed" right={<Pill bg="var(--teal)" color="#fff">Approve</Pill>} />
            <ListRow left="P-4822 · adults 25–55" sub="Eligibility: passed" right={<Pill bg="var(--teal)" color="#fff">Approve</Pill>} />
            <ListRow left="P-4823 · outside range" sub="Eligibility: review" right={<Pill bg="var(--teal-soft)" color="var(--teal-dark)">Review</Pill>} />
          </MiniCard>
        ),
      },
      {
        title: 'Run the study',
        desc:  'Track milestones and compliance in real time as your cohort works through the protocol from home. Automated alerts flag anything at risk.',
        preview: (
          <MiniCard>
            <MiniLabel>Live tracking · sample data</MiniLabel>
            <StatRow items={[
              { label: 'Active',     value: '118', sub: 'of 120' },
              { label: 'Compliance', value: '94%', sub: 'cohort avg' },
              { label: 'Week',       value: '5/8', sub: 'elapsed' },
            ]} />
            <div style={{ height: 6, background: 'var(--bg-page)' }}>
              <div style={{ height: '100%', width: '62%', background: 'var(--teal)' }} />
            </div>
          </MiniCard>
        ),
      },
      {
        title: 'Manage documents & compliance',
        desc:  'Keep consent records, protocol versions, and the audit trail organized in one place — ready to export as a full audit bundle.',
        preview: (
          <MiniCard>
            <MiniLabel>Documents · sample data</MiniLabel>
            <ListRow left="Consent records (118)" sub="Pseudonymized" right={<Pill bg="var(--teal-faint)" color="var(--teal-dark)">Stored</Pill>} />
            <ListRow left="Protocol v2.1" sub="Versioned" right={<Pill bg="var(--teal-faint)" color="var(--teal-dark)">Current</Pill>} />
            <ListRow left="Audit bundle" sub="Export-ready" right={<Pill bg="var(--bg-page)" color="var(--muted)">Export</Pill>} />
          </MiniCard>
        ),
      },
      {
        title: 'Payouts',
        desc:  'On verified completion, research partners receive compensation end-to-end. Per-milestone release keeps payout tied to real participation.',
        preview: (
          <MiniCard>
            <MiniLabel>Compensation · sample data</MiniLabel>
            <ListRow left="Batch · 112 completed" sub="Verified milestones" right={<Pill bg="var(--teal)" color="#fff">Released</Pill>} />
            <ListRow left="$60.00 per partner" sub="Net of platform fee" />
            <div style={{ padding: '11px 14px' }}>
              <ListRow left="6 pending review" right={<Pill bg="var(--teal-soft)" color="var(--teal-dark)">Pending</Pill>} />
            </div>
          </MiniCard>
        ),
      },
    ],
    onboard: {
      headline: 'Invite another researcher',
      desc:     'Send a researcher straight to the study setup flow with a tracked demo link.',
      invites: [
        { label: 'Run a study',  path: '/run-a-study' },
        { label: 'Quick intake', path: '/intake' },
      ],
    },
  },

  // ── Research partner (participant) ──────────────────────────────────────────
  {
    role:    'partner-participant',
    eyebrow: 'Research partner',
    title:   'Join studies, receive compensation',
    blurb:   'Research partners discover studies that match their profile, complete milestones from home, and receive compensation on verified completion — building a participation history along the way.',
    cta:     { label: 'Open the participant dashboard →', href: '/dashboard' },
    steps: [
      {
        title: 'Discover studies',
        desc:  'Browse open studies matched to your profile. Each listing shows the protocol, time commitment, and compensation upfront.',
        preview: (
          <MiniCard accent>
            <MiniLabel>Open studies · sample data</MiniLabel>
            <ListRow left="Gut microbiome & sleep" sub="Microbiome · 8 weeks · remote" right={<Pill bg="var(--teal)" color="#fff">$60</Pill>} />
            <ListRow left="Continuous glucose pilot" sub="Metabolic · 4 weeks · remote" right={<Pill bg="var(--teal)" color="#fff">$45</Pill>} />
            <ListRow left="Sleep & HRV cohort" sub="Wearables · 6 weeks · remote" right={<Pill bg="var(--teal)" color="#fff">$80</Pill>} />
          </MiniCard>
        ),
      },
      {
        title: 'Apply',
        desc:  'One-click application. Review the protocol, confirm you meet the criteria, and submit — no cover letters.',
        preview: (
          <MiniCard>
            <MiniLabel>Application · sample data</MiniLabel>
            <ListRow left="Gut microbiome & sleep" sub="Applied today" right={<Pill bg="var(--teal-soft)" color="var(--teal-dark)">Under review</Pill>} />
          </MiniCard>
        ),
      },
      {
        title: 'Get approved',
        desc:  'The researcher reviews your eligibility and approves you into the cohort. You are notified the moment a slot is yours.',
        preview: (
          <MiniCard>
            <MiniLabel>Status · sample data</MiniLabel>
            <ListRow left="Gut microbiome & sleep" sub="Enrolled · week 1 begins Mon" right={<Pill bg="var(--teal)" color="#fff">Accepted</Pill>} />
          </MiniCard>
        ),
      },
      {
        title: 'Complete tasks',
        desc:  'Work through milestones from home. Self-report tasks are submitted in a tap; researcher-confirmed tasks are verified for you.',
        preview: (
          <MiniCard>
            <MiniLabel>Milestones · sample data</MiniLabel>
            <ListRow left="Week 1 · baseline survey" sub="You report" right={<Pill bg="var(--bg-page)" color="var(--muted)">Done</Pill>} />
            <ListRow left="Week 2 · sample collection" sub="Researcher confirms" right={<Pill bg="var(--bg-page)" color="var(--muted)">Done</Pill>} />
            <ListRow left="Week 3 · weekly check-in" sub="You report" right={<Pill bg="var(--teal)" color="#fff">Submit</Pill>} />
          </MiniCard>
        ),
      },
      {
        title: 'Receive compensation',
        desc:  'On verified completion you receive compensation through your configured payout method. Compensation is tied to milestones, not promises.',
        preview: (
          <MiniCard>
            <MiniLabel>Compensation · sample data</MiniLabel>
            <StatRow items={[
              { label: 'This study', value: '$60',  sub: 'on completion' },
              { label: 'Status',     value: 'Eligible', sub: 'verified' },
            ]} />
          </MiniCard>
        ),
      },
      {
        title: 'Build participation history',
        desc:  'Every completed study becomes a credential on your profile — strengthening your standing for the studies you join next.',
        preview: (
          <MiniCard>
            <MiniLabel>History · sample data</MiniLabel>
            <StatRow items={[
              { label: 'Completed',  value: '5',     sub: 'studies' },
              { label: 'Completion', value: '100%',  sub: 'rate' },
              { label: 'Standing',   value: 'Strong', sub: 'reputation' },
            ]} />
          </MiniCard>
        ),
      },
    ],
    onboard: {
      headline: 'Invite a research partner',
      desc:     'Send a research partner to the participation sign-up flow with a tracked demo link.',
      invites: [
        { label: 'Participate', path: '/participate' },
      ],
    },
  },

  // ── Partner (labs / clinics / orgs) ─────────────────────────────────────────
  {
    role:    'partner-org',
    eyebrow: 'Partner',
    title:   'Labs, clinics & orgs — activated per study',
    blurb:   'Testing labs, clinics, and research organizations join the partner network, list their capabilities, and get matched to studies that fit — coordinating samples and data per engagement.',
    cta:     { label: 'Open the partner network →', href: '/partners/join' },
    steps: [
      {
        title: 'Join',
        desc:  'Apply to the partner network. Per-study contracts — no retainers, no bundled markups.',
        preview: (
          <MiniCard accent>
            <MiniLabel>Partner application · sample data</MiniLabel>
            <ListRow left="Helix Diagnostics, Bengaluru" sub="Type: Testing lab" right={<Pill bg="var(--teal-soft)" color="var(--teal-dark)">Submitted</Pill>} />
          </MiniCard>
        ),
      },
      {
        title: 'List capabilities',
        desc:  'Describe what you offer — assays, sample handling, capacity, turnaround — so the network can match you accurately.',
        preview: (
          <MiniCard>
            <MiniLabel>Capabilities · sample data</MiniLabel>
            <ListRow left="16S rRNA microbiome sequencing" right={<Pill bg="var(--teal-faint)" color="var(--teal-dark)">Listed</Pill>} />
            <ListRow left="Stool & blood sample handling" right={<Pill bg="var(--teal-faint)" color="var(--teal-dark)">Listed</Pill>} />
            <ListRow left="Capacity: 400 samples / week" />
          </MiniCard>
        ),
      },
      {
        title: 'Receive matched studies',
        desc:  'Qualified studies are matched to your capabilities — no cold outreach. Review scope and accept the ones that fit.',
        preview: (
          <MiniCard>
            <MiniLabel>Matched studies · sample data</MiniLabel>
            <ListRow left="Gut microbiome & sleep cohort" sub="120 samples · 16S rRNA" right={<Pill bg="var(--teal)" color="#fff">Match</Pill>} />
            <ListRow left="Metabolic panel pilot" sub="80 samples · blood" right={<Pill bg="var(--teal)" color="#fff">Match</Pill>} />
          </MiniCard>
        ),
      },
      {
        title: 'Coordinate samples & data',
        desc:  'Manage intake, processing, and structured data return per engagement — with a clear, transparent scope for every study.',
        preview: (
          <MiniCard>
            <MiniLabel>Coordination · sample data</MiniLabel>
            <StatRow items={[
              { label: 'Intake',    value: '118', sub: 'received' },
              { label: 'Processed', value: '104', sub: 'of 118' },
              { label: 'Data',      value: '88%',  sub: 'returned' },
            ]} />
          </MiniCard>
        ),
      },
    ],
    onboard: {
      headline: 'Invite a partner',
      desc:     'Send a lab, clinic, or organization to the partner network sign-up with a tracked demo link.',
      invites: [
        { label: 'Partner network', path: '/partners/join' },
      ],
    },
  },
];

// ─── Onboarding link generator ──────────────────────────────────────────────

function OnboardLink({ label, path, origin }: { label: string; path: string; origin: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${origin}${path}?ref=demo`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ ...MONO, fontSize: 10, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--slate)', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          style={{
            flex: '1 1 220px', minWidth: 0, padding: '9px 12px',
            background: 'var(--bg-page)', color: 'var(--slate)',
            border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-sm)',
            ...MONO, fontSize: 12, outline: 'none',
          }}
        />
        <button
          onClick={() => void copy()}
          className="btn-primary"
          style={{ minWidth: 110, padding: '9px 16px', fontSize: 13 }}
        >
          {copied ? 'Copied ✓' : 'Copy link'}
        </button>
      </div>
    </div>
  );
}

// ─── Stepper ────────────────────────────────────────────────────────────────

function FlowWalkthrough({ flow, origin }: { flow: Flow; origin: string }) {
  return (
    <div>
      {/* Flow intro */}
      <div style={{ marginBottom: 28 }}>
        <span style={{ ...MONO, fontSize: 12, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--teal)' }}>
          {flow.eyebrow}
        </span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(22px, 3vw, 30px)', color: 'var(--ink)', margin: '10px 0 12px' }}>
          {flow.title}
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--slate)', lineHeight: 1.6, maxWidth: 620, margin: 0 }}>
          {flow.blurb}
        </p>
      </div>

      {/* Stepper */}
      <div style={{ position: 'relative' }}>
        {flow.steps.map((step, i) => {
          const isLast = i === flow.steps.length - 1;
          return (
            <div key={step.title} style={{ display: 'flex', gap: 16 }} className="demo-step-row">
              {/* Rail */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--teal)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  ...MONO, fontSize: 13, fontWeight: 700, flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                {!isLast && <div style={{ flex: 1, width: 2, background: 'var(--border-mid)', marginTop: 2, marginBottom: 2, minHeight: 24 }} />}
              </div>

              {/* Content */}
              <div style={{ paddingBottom: isLast ? 0 : 28, minWidth: 0, flex: 1 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, color: 'var(--ink)', margin: '4px 0 6px' }}>
                  {step.title}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)', lineHeight: 1.55, margin: '0 0 14px', maxWidth: 560 }}>
                  {step.desc}
                </p>
                <div style={{ maxWidth: 520 }}>{step.preview}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real dashboard CTA */}
      <div style={{ marginTop: 8, marginBottom: 36 }}>
        <Link href={flow.cta.href} className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>
          {flow.cta.label}
        </Link>
      </div>

      {/* Onboard someone */}
      <div style={{
        background: 'var(--teal-faint)',
        border: '1px solid var(--border-soft)',
        borderRadius: 'var(--radius)',
        padding: 'clamp(18px, 3vw, 28px)',
      }}>
        <span style={{ ...MONO, fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--teal-dark)' }}>
          Onboard someone
        </span>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 19, color: 'var(--ink)', margin: '8px 0 6px' }}>
          {flow.onboard.headline}
        </h3>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)', lineHeight: 1.55, margin: '0 0 18px', maxWidth: 560 }}>
          {flow.onboard.desc} Share the link below — it carries a <span style={{ ...MONO, fontSize: 12 }}>?ref=demo</span> tag so you can see it came from a walkthrough.
        </p>
        {flow.onboard.invites.map((inv) => (
          <OnboardLink key={inv.path} label={inv.label} path={inv.path} origin={origin} />
        ))}
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--muted)', margin: '8px 0 0' }}>
          Questions? Point them to <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--teal-dark)', textDecoration: 'none' }}>{CONTACT_EMAIL}</a>.
        </p>
      </div>
    </div>
  );
}

// ─── Role cards (landing) ───────────────────────────────────────────────────

const CARD_COPY: Record<Role, { eyebrow: string; title: string; desc: string }> = {
  'researcher':          { eyebrow: '01', title: 'Researcher',      desc: 'Someone who runs a study — protocol in, cohort and data out.' },
  'partner-participant': { eyebrow: '02', title: 'Research partner', desc: 'Someone who joins studies and receives compensation.' },
  'partner-org':         { eyebrow: '03', title: 'Partner',          desc: 'Labs, clinics & orgs activated per study.' },
};

function RoleCard({ role, onSelect }: { role: Role; onSelect: (r: Role) => void }) {
  const [hover, setHover] = useState(false);
  const c = CARD_COPY[role];
  return (
    <button
      onClick={() => onSelect(role)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        textAlign: 'left', cursor: 'pointer', width: '100%',
        background: 'var(--surface)',
        border: '1px solid var(--border-soft)',
        borderTop: `2px solid ${hover ? 'var(--teal)' : 'var(--border-soft)'}`,
        borderRadius: 'var(--radius)',
        boxShadow: hover ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        padding: '24px 22px',
        transition: 'box-shadow 150ms, border-color 150ms, transform 150ms',
        transform: hover ? 'translateY(-2px)' : 'none',
        display: 'flex', flexDirection: 'column', gap: 10, minHeight: 180,
      }}
    >
      <span style={{ ...MONO, fontSize: 11, fontWeight: 700, letterSpacing: '2px', color: 'var(--teal)' }}>
        {c.eyebrow}
      </span>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--ink)' }}>
        {c.title}
      </span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)', lineHeight: 1.5, flex: 1 }}>
        {c.desc}
      </span>
      <span style={{ ...MONO, fontSize: 12, fontWeight: 700, color: hover ? 'var(--teal-dark)' : 'var(--muted)' }}>
        Walk through →
      </span>
    </button>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const { ready, authenticated, login, user } = usePrivy();
  const [selected, setSelected] = useState<Role | null>(null);

  const origin = useMemo(
    () => (typeof window !== 'undefined' ? window.location.origin : 'https://biome.to'),
    [],
  );

  const email = user?.email?.address ?? null;
  const isOwner = email?.toLowerCase() === DEMO_OWNER_EMAIL;
  const activeFlow = FLOWS.find((f) => f.role === selected) ?? null;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <SiteHeader />

      {/* Demo mode banner */}
      <div style={{
        background: 'var(--teal-dark)', color: '#fff',
        padding: '8px 16px', textAlign: 'center',
      }}>
        <span style={{ ...MONO, fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          Demo mode · product walkthrough
          {isOwner ? ' · signed in as owner' : ''}
        </span>
      </div>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: 'clamp(28px, 5vh, 56px) clamp(16px, 4vw, 32px) 100px' }}>

        {/* Hero */}
        <header style={{ marginBottom: 36 }}>
          <span style={{ ...MONO, fontSize: 12, fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--teal)' }}>
            Biome — product walkthrough
          </span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(28px, 5vw, 44px)', color: 'var(--ink)', lineHeight: 1.1, margin: '12px 0 14px' }}>
            All three sides of Biome, in one walkthrough.
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--slate)', lineHeight: 1.6, maxWidth: 620, margin: 0 }}>
            Pick a role to step through its journey — researcher, research partner, or
            partner. Each step mirrors the real product, with clearly illustrative sample data.
          </p>
        </header>

        {/* Auth gate */}
        {!ready && (
          <div style={{ ...MONO, fontSize: 13, color: 'var(--muted)' }}>Loading…</div>
        )}

        {ready && !authenticated && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border-soft)',
            borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)',
            padding: '40px 32px', textAlign: 'center',
          }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--slate)', marginBottom: 20 }}>
              Sign in to open the walkthrough.
            </p>
            <button onClick={() => login()} className="btn-primary" style={{ minWidth: 140 }}>
              Sign in
            </button>
          </div>
        )}

        {ready && authenticated && (
          <>
            {/* Role selector — always visible */}
            <div className="demo-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
              {FLOWS.map((f) => (
                <RoleCard
                  key={f.role}
                  role={f.role}
                  onSelect={(r) => {
                    setSelected(r);
                    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ))}
            </div>

            {/* Selected flow */}
            {activeFlow && (
              <section style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-soft)',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow-sm)',
                padding: 'clamp(20px, 4vw, 36px)',
              }}>
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    ...MONO, fontSize: 12, fontWeight: 600, color: 'var(--muted)',
                    padding: 0, marginBottom: 20,
                  }}
                >
                  ← Back to roles
                </button>
                <FlowWalkthrough flow={activeFlow} origin={origin} />
              </section>
            )}

            {!activeFlow && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted)', textAlign: 'center' }}>
                Select a role above to begin the walkthrough.
              </p>
            )}
          </>
        )}

        {/* Footer */}
        <footer style={{ marginTop: 64, paddingTop: 24, borderTop: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)' }}>
            Biome Inc · <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--teal-dark)', textDecoration: 'none' }}>{CONTACT_EMAIL}</a>
          </span>
          <span style={{ ...MONO, fontSize: 11, color: 'var(--muted)' }}>
            Walkthrough · sample data
          </span>
        </footer>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .demo-card-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
