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
  applied:   'var(--text-dim)',
  approved:  'var(--cyan)',
  active:    'var(--cyan)',
  completed: 'var(--green)',
  withdrawn: 'var(--text-dim)',
  rejected:  'var(--amber)',
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

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">

        {/* Nav */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="mono text-xs no-underline" style={{ color: 'var(--text-dim)' }}>
            ← BACK
          </Link>
          <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
            // PARTICIPANT_PROFILE
          </span>
        </div>

        {/* ── Identity header ──────────────────────────────────────── */}
        <div
          className="rounded p-6 mb-4"
          style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.08)' }}
        >
          <div className="flex items-start gap-5">
            <Identicon participantId={profile.participant_id} size={64} />
            <div className="flex-1 min-w-0">
              <h1
                className="text-2xl font-black mb-0.5 leading-tight"
                style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)' }}
              >
                {profile.pseudonym}
              </h1>
              <p className="mono text-xs mb-3" style={{ color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
                {profile.participant_id}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <span className="text-sm" style={{ color: 'var(--text-dim)' }}>
                  {countryFlag(profile.country ?? '')} {profile.country}
                </span>
                {profile.year_of_birth && (
                  <span
                    className="mono text-xs px-2 py-0.5 rounded"
                    style={{ color: 'var(--text-dim)', border: '1px solid rgba(77,255,128,0.1)' }}
                  >
                    {ageRange(profile.year_of_birth)} yrs
                  </span>
                )}
                <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                  Since {memberSince(profile.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'TOTAL EARNED',    value: `$${totalEarned.toFixed(2)}`,                              color: 'var(--green)'       },
            { label: 'COMPLETED',       value: String(completed.length),                                  color: 'var(--text-white)'  },
            { label: 'COMPLETION RATE', value: profile.completion_rate != null ? `${profile.completion_rate.toFixed(0)}%` : '—', color: 'var(--text-white)' },
            { label: 'REPUTATION',      value: badge.label,                                               color: badge.color          },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded p-4"
              style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}
            >
              <p className="mono text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>{s.label}</p>
              <p className="mono text-lg font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Experiment history ───────────────────────────────────── */}
        <div
          className="rounded overflow-hidden"
          style={{ border: '1px solid rgba(77,255,128,0.08)' }}
        >
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{ background: 'var(--bg2)', borderBottom: '1px solid rgba(77,255,128,0.06)' }}
          >
            <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
              // EXPERIMENT_HISTORY
            </p>
            <span className="mono text-xs" style={{ color: 'var(--green)' }}>
              [{applications.length}]
            </span>
          </div>

          {applications.length === 0 ? (
            <div className="px-4 py-10 text-center" style={{ background: 'var(--bg)' }}>
              <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                {'>_'} No experiments yet.{' '}
                <Link href="/" style={{ color: 'var(--green)' }}>
                  Browse open bounties →
                </Link>
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto" style={{ background: 'var(--bg)' }}>
              <table className="w-full border-collapse" style={{ minWidth: 480 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(77,255,128,0.06)' }}>
                    {['EXPERIMENT', 'CATEGORY', 'STATUS', 'REWARD'].map((h) => (
                      <th
                        key={h}
                        className="mono text-xs font-normal px-4 py-2.5 text-left"
                        style={{ color: 'var(--text-dim)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    const exp = app.experiments;
                    const cc  = categoryColor(exp?.category ?? '');
                    const sc  = STATUS_COLORS[app.status] ?? 'var(--text-dim)';
                    return (
                      <tr
                        key={app.id}
                        style={{ borderBottom: '1px solid rgba(77,255,128,0.04)' }}
                      >
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-bright)' }}>
                          {exp ? (
                            <Link href={`/experiments/${exp.id}`} style={{ color: 'var(--text-bright)' }}>
                              {exp.title}
                            </Link>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="mono text-xs px-1.5 py-0.5 rounded"
                            style={{ color: cc, border: `1px solid ${cc}30`, background: `${cc}08` }}
                          >
                            {exp?.category.toUpperCase() ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 mono text-xs uppercase" style={{ color: sc }}>
                          {app.status}
                        </td>
                        <td className="px-4 py-3 mono text-xs tabular-nums" style={{ color: app.status === 'completed' ? 'var(--green)' : 'var(--text-dim)' }}>
                          {app.status === 'completed'
                            ? `$${(exp?.bounty_per_participant ?? 0).toFixed(2)}`
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit sections — only visible to profile owner (client-side auth check) */}
        <ProfileEditSections participantId={pid} />

      </div>
    </main>
  );
}
