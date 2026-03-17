import { createAnonClient } from '@/lib/supabase/anon';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Experiment, ExperimentStatus } from '@/lib/types';

const STATUS_CONFIG: Record<ExperimentStatus, { label: string; color: string }> = {
  recruiting: { label: 'RECRUITING', color: 'var(--green)'    },
  active:     { label: 'ACTIVE',     color: 'var(--cyan)'     },
  draft:      { label: 'DRAFT',      color: 'var(--text-dim)' },
  completed:  { label: 'COMPLETED',  color: 'var(--text-dim)' },
  cancelled:  { label: 'CANCELLED',  color: 'var(--amber)'    },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ExperimentPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAnonClient();

  const { data } = await supabase
    .from('experiments')
    .select('*, profiles!experimenter_id(*)')
    .eq('id', id)
    .single();

  if (!data) notFound();

  const exp = data as Experiment & { profiles: { display_name: string | null; bio: string | null } };
  const st = STATUS_CONFIG[exp.status] ?? STATUS_CONFIG.draft;
  const slotPct = exp.slots_total > 0 ? (exp.slots_filled / exp.slots_total) * 100 : 0;

  return (
    <main className="min-h-screen">

      {/* Nav */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-3"
        style={{
          background: 'rgba(7,12,7,0.92)',
          borderBottom: '1px solid rgba(77,255,128,0.08)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Link href="/" className="mono text-xs flex items-center gap-2 no-underline" style={{ color: 'var(--text-dim)' }}>
          ← <span style={{ color: 'var(--green)', fontWeight: 800, letterSpacing: '0.18em' }}>BIOME</span>
        </Link>
        <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
          // EXPERIMENT_DETAIL
        </span>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">

        {/* Breadcrumb */}
        <p className="mono text-xs mb-6" style={{ color: 'var(--text-dim)' }}>
          <Link href="/" style={{ color: 'var(--text-dim)' }}>BIOME</Link>
          {' / '}
          <span style={{ color: 'var(--text-bright)' }}>{exp.title}</span>
        </p>

        {/* Title block */}
        <div className="corner-bracket p-6 rounded mb-8" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.08)' }}>
          <div className="flex flex-wrap items-start gap-3 mb-3">
            <span
              className="mono text-xs px-2 py-0.5 rounded"
              style={{ color: 'var(--text-dim)', border: '1px solid rgba(77,255,128,0.1)' }}
            >
              {exp.category.toUpperCase()}
            </span>
            {exp.is_verified && <span className="badge-verified">✓ BIOME VERIFIED</span>}
            <span className="mono text-xs flex items-center gap-1" style={{ color: st.color }}>
              ● {st.label}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl mb-3">{exp.title}</h1>
          <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
            by {exp.profiles?.display_name ?? 'Unknown'} · {exp.region ?? 'Remote'}
            {exp.is_remote && ' · Remote eligible'}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">

          {/* Main content */}
          <div className="md:col-span-2 flex flex-col gap-6">

            {/* Description */}
            <div className="p-6 rounded" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
              <p className="mono text-xs mb-3" style={{ color: 'var(--text-dim)' }}>// DESCRIPTION</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-bright)' }}>
                {exp.description}
              </p>
            </div>

            {/* Sign up CTA */}
            {(exp.status === 'recruiting') && (
              <div className="p-6 rounded" style={{ background: 'rgba(77,255,128,0.04)', border: '1px solid var(--green-dim)' }}>
                <p className="mono text-xs mb-3" style={{ color: 'var(--text-dim)' }}>// PARTICIPATE</p>
                <p className="text-sm mb-4" style={{ color: 'var(--text-bright)' }}>
                  Earn <span className="font-bold" style={{ color: 'var(--green)' }}>
                    ${exp.bounty_per_participant.toFixed(2)}
                  </span> upon completion.
                  {' '}{exp.slots_total - exp.slots_filled} slots remaining.
                </p>
                <button
                  className="px-6 py-2.5 rounded font-bold mono text-sm transition-all hover:opacity-90"
                  style={{ background: 'var(--green)', color: 'var(--bg)' }}
                >
                  SIGN UP →
                </button>
                <p className="mono text-xs mt-3" style={{ color: 'var(--text-dim)' }}>
                  Auth required. Experimenter reviews applications.
                </p>
              </div>
            )}

            {/* External comms */}
            {exp.external_comms_url && (
              <div className="p-4 rounded" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
                <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>// COMMUNITY</p>
                <a
                  href={exp.external_comms_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono text-xs transition-colors hover:opacity-80"
                  style={{ color: 'var(--cyan)' }}
                >
                  {exp.external_comms_url} ↗
                </a>
              </div>
            )}
          </div>

          {/* Sidebar stats */}
          <div className="flex flex-col gap-4">

            {/* Bounty */}
            <div className="p-5 rounded" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
              <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>BOUNTY / PARTICIPANT</p>
              <p className="text-2xl font-black mono" style={{ color: 'var(--green)' }}>
                ${exp.bounty_per_participant.toFixed(2)}
              </p>
              <p className="mono text-xs mt-2" style={{ color: 'var(--text-dim)' }}>
                Pool: ${exp.total_bounty_pool.toLocaleString()}
              </p>
            </div>

            {/* Slots */}
            <div className="p-5 rounded" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
              <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>SLOTS</p>
              <div className="w-full h-1.5 rounded overflow-hidden mb-2" style={{ background: 'rgba(77,255,128,0.08)' }}>
                <div className="h-1.5 rounded" style={{ width: `${slotPct}%`, background: slotPct >= 90 ? 'var(--amber)' : 'var(--green-dim)' }} />
              </div>
              <p className="mono text-sm tabular-nums" style={{ color: 'var(--text-bright)' }}>
                {exp.slots_filled} / {exp.slots_total}
              </p>
              <p className="mono text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                {exp.slots_total - exp.slots_filled} remaining
              </p>
            </div>

            {/* Duration */}
            {exp.duration_weeks && (
              <div className="p-5 rounded" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
                <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>DURATION</p>
                <p className="mono text-sm" style={{ color: 'var(--text-bright)' }}>{exp.duration_weeks} weeks</p>
              </div>
            )}

            {/* Experimenter */}
            <div className="p-5 rounded" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
              <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>EXPERIMENTER</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-white)' }}>
                {exp.profiles?.display_name ?? 'Unknown'}
              </p>
              {exp.profiles?.bio && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>{exp.profiles.bio}</p>
              )}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
