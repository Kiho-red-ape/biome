import { createAnonClient } from '@/lib/supabase/anon';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Identicon } from '@/components/identicon';
import { ProfileEditSections } from '@/components/profile/edit-sections';
import { ageRange, reputationBadge, memberSince, countryFlag, categoryColor } from '@/lib/utils/profile';

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

const STATUS_COLORS: Record<string, string> = {
  applied:   '#4a7055',
  approved:  '#8ee7ff',
  active:    '#8ee7ff',
  completed: '#b7ff61',
  withdrawn: '#4a7055',
  rejected:  '#ffd166',
};

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
  const badge        = reputationBadge(profile.completion_rate);

  const THIN_DIV = <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: 0 }} />;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Mini nav */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 200,
        height: 52, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 40px',
        background: 'rgba(5,7,9,0.95)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(183,255,97,0.12)',
      }}>
        <Link href="/" style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '2px',
          color: '#7f8e87', textDecoration: 'none',
        }}>
          ← BIOME
        </Link>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '2px', color: '#4a7055' }}>
          // PARTICIPANT_PROFILE
        </span>
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 40px' }}>

        {/* ── Identity header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 0 }}>
          <Identicon participantId={profile.participant_id} size={64} />
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 700,
              color: '#eef4f0', marginBottom: 4, lineHeight: 1.1,
            }}>
              {profile.pseudonym}
            </h1>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4a7055', marginBottom: 10, letterSpacing: '1px' }}>
              {profile.participant_id}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              {profile.country && (
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: '#7f8e87' }}>
                  {countryFlag(profile.country ?? '')} {profile.country}
                </span>
              )}
              {profile.year_of_birth && (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: '#4a7055', border: '1px solid rgba(255,255,255,0.08)',
                  padding: '2px 8px',
                }}>
                  {ageRange(profile.year_of_birth)} yrs
                </span>
              )}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a7055' }}>
                Since {memberSince(profile.created_at)}
              </span>
            </div>
          </div>
        </div>

        <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', margin: '24px 0' }} />

        {/* ── Stats 4-col grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, marginBottom: 0 }}>
          {[
            { label: 'TOTAL EARNED',    value: `$${totalEarned.toFixed(2)}`,                                              color: '#b7ff61'  },
            { label: 'COMPLETED',       value: String(completed.length),                                                    color: '#eef4f0'  },
            { label: 'COMPLETION RATE', value: profile.completion_rate != null ? `${profile.completion_rate.toFixed(0)}%` : '—', color: '#eef4f0' },
            { label: 'REPUTATION',      value: badge.label,                                                                  color: badge.color },
          ].map((s, i) => (
            <div key={s.label} style={{
              padding: '0 24px 0 0',
              paddingLeft: i > 0 ? 24 : 0,
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: '#4a7055', marginBottom: 8 }}>
                {s.label}
              </p>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: s.color, margin: 0 }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', margin: '24px 0' }} />

        {/* ── Experiment history ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '3px',
              textTransform: 'uppercase', color: '#7f8e87',
            }}>
              // EXPERIMENT_HISTORY
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#b7ff61' }}>
              [{applications.length}]
            </span>
          </div>

          {applications.length === 0 ? (
            <div style={{
              padding: '40px 24px', textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.06)', background: '#0b1014',
            }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4a7055' }}>
                No experiments yet.{' '}
                <Link href="/" style={{ color: '#b7ff61', textDecoration: 'none' }}>Browse open studies →</Link>
              </p>
            </div>
          ) : (
            <div style={{ border: '1px solid rgba(255,255,255,0.06)', background: '#0b1014', overflowX: 'auto' }}>
              {/* Header row */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 120px 100px 80px',
                padding: '8px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                {['EXPERIMENT', 'CATEGORY', 'STATUS', 'REWARD'].map((h) => (
                  <span key={h} style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9,
                    textTransform: 'uppercase', letterSpacing: '1.5px', color: '#4a7055',
                  }}>
                    {h}
                  </span>
                ))}
              </div>
              {applications.map((app) => {
                const exp = app.experiments;
                const cc  = categoryColor(exp?.category ?? '');
                const sc  = STATUS_COLORS[app.status] ?? '#4a7055';
                return (
                  <div
                    key={app.id}
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr 120px 100px 80px',
                      padding: '12px 16px', alignItems: 'center',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      transition: 'background 150ms ease',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div style={{ paddingRight: 16, overflow: 'hidden' }}>
                      {exp ? (
                        <Link
                          href={`/experiments/${exp.id}`}
                          style={{
                            fontFamily: 'var(--font-heading)', fontSize: 14,
                            color: '#aab8b1', textDecoration: 'none',
                            display: 'block', overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            transition: 'color 150ms ease',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#eef4f0'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#aab8b1'; }}
                        >
                          {exp.title}
                        </Link>
                      ) : <span style={{ color: '#4a7055' }}>—</span>}
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9,
                      textTransform: 'uppercase', letterSpacing: '1px',
                      color: cc, border: `1px solid ${cc}30`,
                      background: `${cc}08`, padding: '3px 6px',
                      display: 'inline-block', maxWidth: '100%',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {exp?.category?.toUpperCase() ?? '—'}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: sc }}>
                      {app.status}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
                      color: app.status === 'completed' ? '#b7ff61' : '#4a7055',
                    }}>
                      {app.status === 'completed' ? `$${(exp?.bounty_per_participant ?? 0).toFixed(2)}` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {THIN_DIV}

        {/* Edit sections */}
        <div style={{ marginTop: 24 }}>
          <ProfileEditSections participantId={pid} />
        </div>

      </div>
    </main>
  );
}
