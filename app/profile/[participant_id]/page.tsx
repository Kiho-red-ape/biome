import { createAnonClient } from '@/lib/supabase/anon';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Identicon } from '@/components/identicon';
import { ProfileEditSections } from '@/components/profile/edit-sections';
import { ProfileGated } from '@/components/profile/gated';
import { ageRange, memberSince, countryFlag } from '@/lib/utils/profile';
import { SiteHeader } from '@/components/nav/header';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfileRow = {
  participant_id: string;
  pseudonym: string;
  country: string | null;
  year_of_birth: number | null;
  completion_rate: number | null;
  reliability_score: number | null;
  previous_study_count: number | null;
  created_at: string;
  user_id: string;
};

type AppRow = {
  id: string;
  status: string;
  applied_at: string;
  experiments: { id: string; title: string; category: string; bounty_per_participant: number } | null;
};

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  applied:   { bg: 'var(--warning-soft)', color: 'var(--warning)',   border: 'rgba(180,83,9,0.2)'    },
  approved:  { bg: 'var(--teal-soft)',    color: 'var(--teal-dark)', border: 'rgba(14,116,144,0.2)'  },
  active:    { bg: 'var(--teal-soft)',    color: 'var(--teal-dark)', border: 'rgba(14,116,144,0.2)'  },
  completed: { bg: 'var(--success-soft)', color: 'var(--success)',   border: 'rgba(21,128,61,0.2)'   },
  withdrawn: { bg: 'var(--bg-page)',      color: 'var(--muted)',     border: 'var(--border-soft)'    },
  rejected:  { bg: 'var(--error-soft)',   color: 'var(--error)',     border: 'rgba(185,28,28,0.2)'   },
};

function reputationStyle(rate: number | null | undefined) {
  if (rate == null) return { label: 'New',          bg: 'var(--bg-page)',      color: 'var(--muted)',     border: 'var(--border-soft)'   };
  if (rate >= 95)   return { label: 'Excellent',    bg: 'var(--success-soft)', color: 'var(--success)',   border: 'rgba(21,128,61,0.2)'  };
  if (rate >= 80)   return { label: 'Strong',       bg: 'var(--teal-soft)',    color: 'var(--teal-dark)', border: 'rgba(14,116,144,0.2)' };
  return               { label: 'Needs Review', bg: 'var(--warning-soft)', color: 'var(--warning)',   border: 'rgba(180,83,9,0.2)'   };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ participant_id: string }>;
}) {
  const { participant_id: raw } = await params;
  const pid = decodeURIComponent(raw).toUpperCase();

  const supabase = createAnonClient();

  const { data: profileData, error: profileError } = await supabase
    .from('participant_profiles')
    .select(
      'participant_id, pseudonym, country, year_of_birth, ' +
      'completion_rate, reliability_score, previous_study_count, ' +
      'created_at, user_id'
    )
    .eq('participant_id', pid)
    .single();

  if (profileError || !profileData) notFound();

  const profile = profileData as unknown as ProfileRow;

  const { data: appsData } = await supabase
    .from('applications')
    .select('id, status, applied_at, experiments(id, title, category, bounty_per_participant)')
    .eq('participant_id', profile.user_id)
    .order('applied_at', { ascending: false });

  const applications = (appsData ?? []) as unknown as AppRow[];
  const completed    = applications.filter((a) => a.status === 'completed');
  const totalEarned  = completed.reduce((s, a) => s + (a.experiments?.bounty_per_participant ?? 0), 0);
  const rep          = reputationStyle(profile.completion_rate);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <SiteHeader />

      {/* ── Identity strip ── */}
      <section style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(40px, 6vw, 64px) 24px' }}>

          {/* Back */}
          <Link href="/" style={{
            fontFamily:     'var(--font-display)',
            fontSize:       13,
            fontWeight:     500,
            color:          'var(--muted)',
            textDecoration: 'none',
            display:        'inline-block',
            marginBottom:   28,
          }}>
            ← Biome
          </Link>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
            {/* Identicon */}
            <div style={{
              border:       '1px solid var(--border-soft)',
              borderRadius: 'var(--radius)',
              boxShadow:    'var(--shadow-sm)',
              overflow:     'hidden',
              flexShrink:   0,
              lineHeight:   0,
            }}>
              <Identicon participantId={profile.participant_id} size={72} />
            </div>

            {/* Name + meta */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{
                fontFamily:   'var(--font-display)',
                fontWeight:   600,
                fontSize:     'clamp(22px, 3vw, 32px)',
                color:        'var(--ink)',
                lineHeight:   1.15,
                marginBottom: 8,
              }}>
                {profile.pseudonym}
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', letterSpacing: '0.5px' }}>
                  {profile.participant_id}
                </span>
                {profile.country && (
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)' }}>
                    {countryFlag(profile.country)} {profile.country}
                  </span>
                )}
                {profile.year_of_birth && (
                  <span className="chip chip-ghost">
                    {ageRange(profile.year_of_birth)} yrs
                  </span>
                )}
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--muted)' }}>
                  Since {memberSince(profile.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats row + history (gated) ── */}
      <ProfileGated>

      {/* ── Stats row ── */}
      <section>
        <div
          style={{
            maxWidth:            900,
            margin:              '32px auto 0',
            padding:             '0 24px',
            display:             'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap:                 16,
          }}
          className="profile-stats-grid"
        >
          {[
            { label: 'Compensation',    value: `$${totalEarned.toFixed(2)}`, isRep: false },
            { label: 'Completed',       value: String(completed.length),     isRep: false },
            { label: 'Completion Rate', value: profile.completion_rate != null ? `${profile.completion_rate.toFixed(0)}%` : '—', isRep: false },
            { label: 'Reputation',      value: rep.label, repBg: rep.bg, repColor: rep.color, repBorder: rep.border, isRep: true },
          ].map((s) => (
            <div key={s.label} style={{
              background:   'var(--surface)',
              border:       '1px solid var(--border-soft)',
              borderRadius: 'var(--radius)',
              boxShadow:    'var(--shadow-sm)',
              padding:      '24px 20px',
              textAlign:    'center',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 10 }}>
                {s.label}
              </div>
              {s.isRep ? (
                <span style={{
                  background:   s.repBg,
                  color:        s.repColor,
                  border:       `1px solid ${s.repBorder}`,
                  borderRadius: 999,
                  fontFamily:   'var(--font-display)',
                  fontWeight:   600,
                  fontSize:     12,
                  padding:      '4px 12px',
                  display:      'inline-block',
                }}>
                  {s.value}
                </span>
              ) : (
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--ink)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {s.value}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Study history ── */}
      <section>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 8px' }}>
          <div style={{
            background:   'var(--surface)',
            border:       '1px solid var(--border-soft)',
            borderRadius: 'var(--radius)',
            boxShadow:    'var(--shadow-sm)',
            overflow:     'hidden',
          }}>
            {/* Header */}
            <div style={{
              padding:      '16px 24px',
              borderBottom: '1px solid var(--border-soft)',
              fontFamily:   'var(--font-display)',
              fontSize:     12,
              fontWeight:   600,
              letterSpacing:'1px',
              textTransform:'uppercase' as const,
              color:        'var(--teal)',
              background:   'var(--bg-page)',
              display:      'flex',
              alignItems:   'center',
              gap:          10,
            }}>
              Study History
              <span className="chip chip-amber">
                {applications.length}
              </span>
            </div>

            {applications.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 16 }}>
                  No studies yet.
                </p>
                <Link href="/" className="btn-primary">
                  Browse open studies →
                </Link>
              </div>
            ) : (
              <div>
                {/* Column headers */}
                <div style={{
                  display:             'grid',
                  gridTemplateColumns: '1fr 120px 100px 80px',
                  padding:             '10px 24px',
                  borderBottom:        '1px solid var(--border-soft)',
                  background:          'var(--bg-page)',
                  minWidth:            480,
                }}>
                  {['Study', 'Category', 'Status', 'Reward'].map(h => (
                    <span key={h} style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, color: 'var(--muted)' }}>
                      {h}
                    </span>
                  ))}
                </div>
                <div style={{ overflowX: 'auto' }}>
                  {applications.map((app, i) => {
                    const exp = app.experiments;
                    const ss  = STATUS_STYLE[app.status] ?? { bg: 'var(--bg-page)', color: 'var(--muted)', border: 'var(--border-soft)' };
                    return (
                      <div key={app.id} style={{
                        display:             'grid',
                        gridTemplateColumns: '1fr 120px 100px 80px',
                        padding:             '14px 24px',
                        borderBottom:        i < applications.length - 1 ? '1px solid var(--border-soft)' : 'none',
                        alignItems:          'center',
                        minWidth:            480,
                      }}>
                        <div style={{ paddingRight: 16, overflow: 'hidden' }}>
                          {exp ? (
                            <Link href={`/experiments/${exp.id}`} style={{
                              fontFamily:   'var(--font-body)',
                              fontSize:     14,
                              color:        'var(--ink)',
                              textDecoration: 'none',
                              display:      'block',
                              overflow:     'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace:   'nowrap',
                            }}>
                              {exp.title}
                            </Link>
                          ) : <span style={{ color: 'var(--muted)' }}>—</span>}
                        </div>
                        <span style={{
                          fontFamily:    'var(--font-display)',
                          fontSize:      10,
                          fontWeight:    600,
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase' as const,
                          background:    'var(--bg-page)',
                          color:         'var(--slate)',
                          border:        '1px solid var(--border-soft)',
                          borderRadius:  999,
                          padding:       '2px 10px',
                          display:       'inline-block',
                          overflow:      'hidden',
                          textOverflow:  'ellipsis',
                          whiteSpace:    'nowrap',
                          maxWidth:      '100%',
                        }}>
                          {exp?.category ?? '—'}
                        </span>
                        <span style={{
                          fontFamily:    'var(--font-display)',
                          fontSize:      10,
                          fontWeight:    600,
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase' as const,
                          background:    ss.bg,
                          color:         ss.color,
                          border:        `1px solid ${ss.border}`,
                          borderRadius:  999,
                          padding:       '2px 10px',
                          display:       'inline-block',
                        }}>
                          {app.status}
                        </span>
                        <span style={{
                          fontFamily:         'var(--font-display)',
                          fontWeight:         600,
                          fontSize:           14,
                          fontVariantNumeric: 'tabular-nums',
                          color:              app.status === 'completed' ? 'var(--ink)' : 'var(--muted)',
                        }}>
                          {app.status === 'completed' ? `$${(exp?.bounty_per_participant ?? 0).toFixed(2)}` : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      </ProfileGated>

      {/* ── Edit sections ── */}
      <section>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>
          <ProfileEditSections participantId={pid} />
        </div>
      </section>

      <style>{`
        @media (max-width: 640px) {
          .profile-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </main>
  );
}
