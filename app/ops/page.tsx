'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { OpsPageHeader, OpsCard, OpsBadge } from './_components/ui';

interface Stats {
  totalStudies:         number;
  activeStudies:        number;
  totalParticipants:    number;
  verifiedParticipants: number;
  newIntakes:           number;
  qualifiedIntakes:     number;
  pendingPartners:      number;
  pendingApprovals:     number;
  kitsInTransit:        number;
  overdueKits:          number;
  pendingPayoutCount:   number;
  pendingPayoutTotal:   number;
  mtdRevenue:           number;
  uncontactedLeads:     number;
  totalLeads:           number;
  activity: { type: string; text: string; sub: string; time: string }[];
}

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)' };

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const ACTIVITY_TONE: Record<string, 'teal' | 'green' | 'blue'> = {
  intake:  'blue',
  payout:  'green',
  partner: 'teal',
};

// ── Stat tile with a big value + supporting sub-line ──────────
function StatTile({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div style={{
      background:   'var(--surface)',
      border:       '1px solid var(--border-soft)',
      borderRadius: 'var(--radius-sm)',
      boxShadow:    'var(--shadow-sm)',
      padding:      '16px 18px',
    }}>
      <div style={{ ...MONO, fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, lineHeight: 1,
        color: accent ? 'var(--teal-dark)' : 'var(--ink)', marginBottom: 6,
      }}>
        {value}
      </div>
      <div style={{ ...MONO, fontSize: 11, color: 'var(--muted)' }}>{sub}</div>
    </div>
  );
}

// ── Clickable quick-nav card with hover lift ──────────────────
function NavCard({
  label, count, sub, urgent, href,
}: {
  label: string; count: number; sub: string; urgent: boolean; href: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position:       'relative',
        display:        'block',
        background:     'var(--surface)',
        border:         `1px solid ${hov ? 'var(--teal)' : 'var(--border-soft)'}`,
        borderRadius:   'var(--radius)',
        boxShadow:      hov ? 'var(--shadow-md, 0 6px 20px rgba(15,23,42,0.08))' : 'var(--shadow-sm)',
        padding:        '16px 18px 14px',
        textDecoration: 'none',
        transform:      hov ? 'translateY(-2px)' : 'translateY(0)',
        transition:     'transform 120ms, border-color 120ms, box-shadow 120ms',
      }}
    >
      {urgent && (
        <span style={{
          position: 'absolute', top: 12, right: 14,
          width: 7, height: 7, borderRadius: '50%',
          background: '#d97706', display: 'block',
        }} />
      )}
      <div style={{ ...MONO, fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, lineHeight: 1,
        color: urgent ? '#b45309' : 'var(--ink)', marginBottom: 4,
      }}>
        {count}
      </div>
      <div style={{ ...MONO, fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>{sub}</div>
      <div style={{ ...MONO, fontSize: 10, fontWeight: 600, letterSpacing: '0.5px', color: hov ? 'var(--teal-dark)' : 'var(--teal)', transition: 'color 120ms' }}>
        Open →
      </div>
    </Link>
  );
}

export default function OpsDashboard() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ops/dashboard-stats')
      .then(r => r.json())
      .then((d: Stats) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <OpsPageHeader
        label="Overview"
        title="Operator Console"
        subtitle="Live snapshot across the platform. Jump into any queue below."
      />

      {loading || !stats ? (
        <p style={{ ...MONO, fontSize: 12, color: 'var(--muted)' }}>
          {loading ? 'Loading…' : 'Could not load dashboard stats.'}
        </p>
      ) : (
        <>
          {/* Row 1 — Global stat strip */}
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap:                 12,
            marginBottom:        28,
          }}>
            <StatTile label="Studies"      value={String(stats.activeStudies)}                 sub={`${stats.totalStudies} total`}                                              accent />
            <StatTile label="Participants" value={String(stats.verifiedParticipants)}          sub={`${stats.totalParticipants} enrolled`}                                      accent />
            <StatTile label="Pipeline"     value={String(stats.newIntakes)}                    sub={`${stats.qualifiedIntakes} qualified · ${stats.pendingPartners} partner apps`} />
            <StatTile label="MTD revenue"  value={`$${stats.mtdRevenue.toLocaleString()}`}     sub={`$${stats.pendingPayoutTotal.toLocaleString()} pending payout`} />
          </div>

          {/* Row 2 — Quick-nav action cards */}
          <p style={{ ...MONO, fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--teal)', margin: '0 0 12px' }}>
            Action queues
          </p>
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap:                 12,
            marginBottom:        32,
          }}>
            <NavCard label="Client intakes" count={stats.newIntakes}         sub={`${stats.qualifiedIntakes} qualified`}                                   urgent={stats.newIntakes > 0}         href="/ops/intakes" />
            <NavCard label="Approvals"      count={stats.pendingApprovals}   sub="experimenter reviews"                                                    urgent={stats.pendingApprovals > 0}   href="/ops/researchers" />
            <NavCard label="Logistics"      count={stats.kitsInTransit}      sub={stats.overdueKits > 0 ? `${stats.overdueKits} overdue` : 'in transit'}   urgent={stats.overdueKits > 0}        href="/ops/logistics" />
            <NavCard label="Payouts"        count={stats.pendingPayoutCount} sub="pending payout"                                                          urgent={stats.pendingPayoutCount > 0} href="/ops/payouts" />
            <NavCard label="Estimate leads" count={stats.uncontactedLeads}   sub={`${stats.totalLeads} total`}                                             urgent={stats.uncontactedLeads > 0}   href="/ops/estimate-leads" />
            <NavCard label="Partner apps"   count={stats.pendingPartners}    sub="awaiting review"                                                         urgent={stats.pendingPartners > 0}    href="/ops/partners" />
          </div>

          {/* Row 3 — Recent activity */}
          {stats.activity.length > 0 && (
            <>
              <p style={{ ...MONO, fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--teal)', margin: '0 0 12px' }}>
                Recent activity
              </p>
              <OpsCard>
                {stats.activity.map((item, i) => (
                  <div key={i} style={{
                    display:    'flex',
                    alignItems: 'center',
                    gap:        14,
                    padding:    '12px 18px',
                    borderTop:  i === 0 ? 'none' : '1px solid var(--border-soft)',
                  }}>
                    <OpsBadge tone={ACTIVITY_TONE[item.type] ?? 'slate'}>{item.type}</OpsBadge>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.text}
                      </div>
                      {item.sub && (
                        <div style={{ ...MONO, fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                          {item.sub}
                        </div>
                      )}
                    </div>
                    <span style={{ ...MONO, fontSize: 10, color: 'var(--muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {timeAgo(item.time)}
                    </span>
                  </div>
                ))}
              </OpsCard>
            </>
          )}
        </>
      )}
    </div>
  );
}
