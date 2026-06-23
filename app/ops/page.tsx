'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const C = {
  bg:                '#0c1219',
  bg2:               '#111d2b',
  amber:             '#ffb300',
  amberSoft:         'rgba(255,179,0,0.10)',
  amberBorder:       'rgba(255,179,0,0.32)',
  amberBorderBright: 'rgba(255,179,0,0.75)',
  text:              '#8b9eb0',
  textDim:           '#4a5e6e',
  white:             '#e2eaf2',
  line:              'rgba(255,255,255,0.07)',
  urgentBg:          'rgba(255,179,0,0.06)',
};

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

const ACTIVITY_ICON: Record<string, string> = {
  intake:  '↘',
  payout:  '↗',
  partner: '◈',
};

export default function OpsDashboard() {
  const router = useRouter();
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/ops/dashboard-stats')
      .then(r => r.json())
      .then((d: Stats) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    {
      id:    'studies',
      label: 'STUDIES',
      big:   String(stats.activeStudies),
      sub:   `${stats.totalStudies} total`,
    },
    {
      id:    'participants',
      label: 'PARTICIPANTS',
      big:   String(stats.verifiedParticipants),
      sub:   `${stats.totalParticipants} enrolled`,
    },
    {
      id:    'pipeline',
      label: 'PIPELINE',
      big:   String(stats.newIntakes),
      sub:   `${stats.qualifiedIntakes} qualified · ${stats.pendingPartners} partner apps`,
    },
    {
      id:    'revenue',
      label: 'MTD REVENUE',
      big:   `$${stats.mtdRevenue.toLocaleString()}`,
      sub:   `$${stats.pendingPayoutTotal.toLocaleString()} pending`,
    },
  ] : [];

  const navCards = stats ? [
    {
      id:     'intakes',
      label:  'CLIENT INTAKES',
      count:  stats.newIntakes,
      sub:    `${stats.qualifiedIntakes} qualified`,
      urgent: stats.newIntakes > 0,
      href:   '/ops/intakes',
    },
    {
      id:     'approvals',
      label:  'APPROVALS',
      count:  stats.pendingApprovals,
      sub:    'experimenter reviews',
      urgent: stats.pendingApprovals > 0,
      href:   '/ops/researchers',
    },
    {
      id:     'logistics',
      label:  'LOGISTICS',
      count:  stats.kitsInTransit,
      sub:    stats.overdueKits > 0 ? `${stats.overdueKits} overdue` : 'in transit',
      urgent: stats.overdueKits > 0,
      href:   '/ops/logistics',
    },
    {
      id:     'payouts',
      label:  'PAYOUTS',
      count:  stats.pendingPayoutCount,
      sub:    'pending payout',
      urgent: stats.pendingPayoutCount > 0,
      href:   '/ops/payouts',
    },
    {
      id:     'leads',
      label:  'ESTIMATE LEADS',
      count:  stats.uncontactedLeads,
      sub:    `${stats.totalLeads} total`,
      urgent: stats.uncontactedLeads > 0,
      href:   '/ops/estimate-leads',
    },
    {
      id:     'partners',
      label:  'PARTNER APPS',
      count:  stats.pendingPartners,
      sub:    'awaiting review',
      urgent: stats.pendingPartners > 0,
      href:   '/ops/partners',
    },
  ] : [];

  return (
    <div style={{ minHeight: '100%', background: C.bg, padding: '32px 32px 64px', color: C.text }}>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <p style={{
          fontFamily:    '"Space Grotesk", var(--font-display)',
          fontSize:      11,
          fontWeight:    700,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          color:         C.amber,
          marginBottom:  8,
        }}>
          Operator Console
        </p>
        <h1 style={{
          fontFamily: '"Space Grotesk", var(--font-display)',
          fontSize:   28,
          fontWeight: 700,
          color:      C.white,
          margin:     0,
        }}>
          Dashboard
        </h1>
      </div>

      {loading ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: C.textDim }}>
          Loading…
        </div>
      ) : (
        <>
          {/* Row 1 — Stat strip */}
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap:                 16,
            marginBottom:        32,
          }}>
            {statCards.map(card => (
              <div key={card.id} style={{
                background:   C.bg2,
                border:       `3px solid ${C.amberBorder}`,
                borderRadius: 4,
                padding:      '20px 24px 18px',
              }}>
                <p style={{
                  fontFamily:    'var(--font-mono)',
                  fontSize:      9,
                  letterSpacing: '2.5px',
                  textTransform: 'uppercase',
                  color:         C.textDim,
                  margin:        '0 0 10px',
                }}>
                  {card.label}
                </p>
                <p style={{
                  fontFamily: '"Space Grotesk", var(--font-display)',
                  fontSize:   36,
                  fontWeight: 700,
                  color:      C.amber,
                  margin:     '0 0 6px',
                  lineHeight: 1,
                }}>
                  {card.big}
                </p>
                <p style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize:   11,
                  color:      C.textDim,
                  margin:     0,
                }}>
                  {card.sub}
                </p>
              </div>
            ))}
          </div>

          {/* Row 2 — Quick-nav cards */}
          <p style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      9,
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            color:         C.textDim,
            margin:        '0 0 14px',
          }}>
            Action areas
          </p>
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap:                 12,
            marginBottom:        40,
          }}>
            {navCards.map(card => {
              const isHov = hovered === card.id;
              return (
                <div
                  key={card.id}
                  onMouseEnter={() => setHovered(card.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => router.push(card.href)}
                  style={{
                    position:     'relative',
                    background:   card.urgent ? C.urgentBg : C.bg2,
                    border:       `1px solid ${isHov ? C.amberBorderBright : card.urgent ? C.amberBorder : C.line}`,
                    borderRadius: 4,
                    padding:      '18px 20px 16px',
                    cursor:       'pointer',
                    transform:    isHov ? 'translateY(-2px)' : 'translateY(0)',
                    transition:   'transform 0.12s ease, border-color 0.12s ease',
                  }}
                >
                  {card.urgent && (
                    <span style={{
                      position:     'absolute',
                      top:          10,
                      right:        12,
                      width:        7,
                      height:       7,
                      borderRadius: '50%',
                      background:   C.amber,
                      display:      'block',
                    }} />
                  )}
                  <p style={{
                    fontFamily:    'var(--font-mono)',
                    fontSize:      9,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    color:         C.textDim,
                    margin:        '0 0 8px',
                  }}>
                    {card.label}
                  </p>
                  <p style={{
                    fontFamily: '"Space Grotesk", var(--font-display)',
                    fontSize:   28,
                    fontWeight: 700,
                    color:      card.urgent ? C.amber : C.white,
                    margin:     '0 0 4px',
                    lineHeight: 1,
                  }}>
                    {card.count}
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize:   10,
                    color:      C.textDim,
                    margin:     '0 0 14px',
                  }}>
                    {card.sub}
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize:   10,
                    color:      isHov ? C.amber : C.textDim,
                    margin:     0,
                    transition: 'color 0.12s ease',
                  }}>
                    Navigate →
                  </p>
                </div>
              );
            })}
          </div>

          {/* Row 3 — Activity feed */}
          {stats && stats.activity.length > 0 && (
            <>
              <p style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      9,
                letterSpacing: '2.5px',
                textTransform: 'uppercase',
                color:         C.textDim,
                margin:        '0 0 14px',
              }}>
                Recent activity
              </p>
              <div style={{
                background:   C.bg2,
                border:       `1px solid ${C.line}`,
                borderRadius: 4,
                overflow:     'hidden',
              }}>
                {stats.activity.map((item, i) => (
                  <div key={i} style={{
                    display:   'flex',
                    alignItems: 'flex-start',
                    gap:        14,
                    padding:    '13px 20px',
                    borderTop:  i === 0 ? 'none' : `1px solid ${C.line}`,
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize:   13,
                      color:      C.amber,
                      lineHeight: 1.3,
                      flexShrink: 0,
                      width:      16,
                      textAlign:  'center',
                    }}>
                      {ACTIVITY_ICON[item.type] ?? '·'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontFamily:   'var(--font-mono)',
                        fontSize:     12,
                        color:        C.white,
                        margin:       '0 0 2px',
                        overflow:     'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace:   'nowrap',
                      }}>
                        {item.text}
                      </p>
                      {item.sub && (
                        <p style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize:   11,
                          color:      C.textDim,
                          margin:     0,
                        }}>
                          {item.sub}
                        </p>
                      )}
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize:   10,
                      color:      C.textDim,
                      flexShrink: 0,
                      lineHeight: 1.8,
                    }}>
                      {timeAgo(item.time)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
