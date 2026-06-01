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

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  applied:   { bg: 'var(--amber)',     color: 'var(--black)' },
  approved:  { bg: 'var(--navy)',      color: 'var(--white)' },
  active:    { bg: 'var(--navy)',      color: 'var(--white)' },
  completed: { bg: 'var(--black)',     color: 'var(--amber)' },
  withdrawn: { bg: 'var(--off-white)', color: 'var(--gray)'  },
  rejected:  { bg: '#dc2626',          color: 'var(--white)' },
};

function reputationStyle(rate: number | null | undefined) {
  if (rate == null) return { label: 'New',         bg: 'var(--off-white)', color: 'var(--gray)'  };
  if (rate >= 95)   return { label: 'Excellent',   bg: 'var(--black)',    color: 'var(--amber)' };
  if (rate >= 80)   return { label: 'Strong',      bg: 'var(--navy)',     color: 'var(--white)' };
  return               { label: 'Needs Review', bg: 'var(--amber)',   color: 'var(--black)' };
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
    <main style={{ minHeight: '100vh', background: 'var(--off-white)' }}>
      <SiteHeader />

      {/* ── Identity strip (navy) ── */}
      <section style={{ background: 'var(--navy)', borderBottom: '3px solid var(--black)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(40px, 6vw, 64px) 24px' }}>

          {/* Back */}
          <Link href="/" style={{
            fontFamily:     'var(--font-display)',
            fontSize:       12,
            fontWeight:     600,
            color:          'rgba(255,255,255,0.4)',
            textDecoration: 'none',
            display:        'inline-block',
            marginBottom:   28,
            letterSpacing:  '0.5px',
          }}>
            ← Biome
          </Link>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
            {/* Identicon */}
            <div style={{ border: '3px solid var(--amber)', flexShrink: 0 }}>
              <Identicon participantId={profile.participant_id} size={72} />
            </div>

            {/* Name + meta */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{
                fontFamily:   'var(--font-display)',
                fontWeight:   700,
                fontSize:     'clamp(22px, 3vw, 32px)',
                color:        'var(--white)',
                lineHeight:   1.1,
                marginBottom: 8,
              }}>
                {profile.pseudonym}
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.5px' }}>
                  {profile.participant_id}
                </span>
                {profile.country && (
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                    {countryFlag(profile.country)} {profile.country}
                  </span>
                )}
                {profile.year_of_birth && (
                  <span style={{
                    fontFamily:    'var(--font-display)',
                    fontSize:      9,
                    fontWeight:    600,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    background:    'rgba(255,255,255,0.08)',
                    color:         'rgba(255,255,255,0.5)',
                    padding:       '2px 8px',
                    border:        '1px solid rgba(255,255,255,0.12)',
                  }}>
                    {ageRange(profile.year_of_birth)} yrs
                  </span>
                )}
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
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
      <section style={{ background: 'var(--white)', borderBottom: '3px solid var(--black)' }}>
        <div style={{
          maxWidth:            900,
          margin:              '0 auto',
          display:             'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          borderLeft:          '3px solid var(--black)',
          boxShadow:           '4px 4px 0 var(--black)',
        }}
          className="profile-stats-grid"
        >
          {[
            { label: 'Total Earned',    value: `$${totalEarned.toFixed(2)}`, isRep: false },
            { label: 'Completed',       value: String(completed.length),     isRep: false },
            { label: 'Completion Rate', value: profile.completion_rate != null ? `${profile.completion_rate.toFixed(0)}%` : '—', isRep: false },
            { label: 'Reputation',      value: rep.label, repBg: rep.bg, repColor: rep.color, isRep: true },
          ].map((s, i) => (
            <div key={s.label} style={{
              padding:      '24px 20px',
              borderRight:  '2px solid var(--black)',
              textAlign:    'center',
              borderBottom: '3px solid var(--black)',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' as const, color: 'var(--gray)', marginBottom: 10 }}>
                {s.label}
              </div>
              {s.isRep ? (
                <span style={{ background: s.repBg, color: s.repColor, border: '2px solid var(--black)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, padding: '4px 10px', display: 'inline-block' }}>
                  {s.value}
                </span>
              ) : (
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--black)', lineHeight: 1 }}>
                  {s.value}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Experiment history ── */}
      <section style={{ background: 'var(--off-white)', borderBottom: '3px solid var(--black)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
          <div style={{
            border:     '3px solid var(--black)',
            boxShadow:  '4px 4px 0 var(--black)',
            background: 'var(--white)',
          }}>
            {/* Header */}
            <div style={{
              padding:      '14px 24px',
              borderBottom: '3px solid var(--black)',
              fontFamily:   'var(--font-display)',
              fontSize:     11,
              fontWeight:   600,
              letterSpacing:'3px',
              textTransform:'uppercase' as const,
              color:        'var(--black)',
              background:   'var(--off-white)',
              display:      'flex',
              alignItems:   'center',
              gap:          10,
            }}>
              Study History
              <span style={{ background: 'var(--amber)', color: 'var(--black)', border: '1.5px solid var(--black)', padding: '0 6px', fontSize: 10 }}>
                {applications.length}
              </span>
            </div>

            {applications.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--black)', marginBottom: 12 }}>
                  No experiments yet.
                </p>
                <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--black)', background: 'var(--amber)', border: '2px solid var(--black)', padding: '8px 20px', textDecoration: 'none' }}>
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
                  borderBottom:        '2px solid rgba(0,0,0,0.08)',
                  background:          'var(--off-white)',
                  minWidth:            480,
                }}>
                  {['Study', 'Category', 'Status', 'Reward'].map(h => (
                    <span key={h} style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' as const, color: 'var(--gray)' }}>
                      {h}
                    </span>
                  ))}
                </div>
                <div style={{ overflowX: 'auto' }}>
                  {applications.map((app, i) => {
                    const exp = app.experiments;
                    const ss  = STATUS_STYLE[app.status] ?? { bg: 'var(--off-white)', color: 'var(--gray)' };
                    return (
                      <div key={app.id} style={{
                        display:             'grid',
                        gridTemplateColumns: '1fr 120px 100px 80px',
                        padding:             '14px 24px',
                        borderBottom:        i < applications.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                        alignItems:          'center',
                        minWidth:            480,
                      }}>
                        <div style={{ paddingRight: 16, overflow: 'hidden' }}>
                          {exp ? (
                            <Link href={`/experiments/${exp.id}`} style={{
                              fontFamily:   'var(--font-body)',
                              fontSize:     14,
                              color:        'var(--black)',
                              textDecoration: 'none',
                              display:      'block',
                              overflow:     'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace:   'nowrap',
                            }}>
                              {exp.title}
                            </Link>
                          ) : <span style={{ color: 'var(--gray)' }}>—</span>}
                        </div>
                        <span style={{
                          fontFamily:    'var(--font-display)',
                          fontSize:      9,
                          fontWeight:    600,
                          letterSpacing: '1px',
                          textTransform: 'uppercase' as const,
                          background:    'var(--off-white)',
                          color:         'var(--gray)',
                          border:        '1.5px solid var(--black)',
                          padding:       '2px 6px',
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
                          fontSize:      9,
                          fontWeight:    700,
                          letterSpacing: '1px',
                          textTransform: 'uppercase' as const,
                          background:    ss.bg,
                          color:         ss.color,
                          border:        '1.5px solid var(--black)',
                          padding:       '2px 6px',
                          display:       'inline-block',
                        }}>
                          {app.status}
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 700,
                          fontSize:   14,
                          color:      app.status === 'completed' ? 'var(--black)' : 'var(--gray)',
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
      <section style={{ background: 'var(--off-white)' }}>
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
