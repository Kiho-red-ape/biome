'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { SiteHeader } from '@/components/nav/header';

// ─── Types ──────────────────────────────────────────────────────────────────

type RunStatus = 'queued' | 'running' | 'complete' | 'failed';

type FindRun = {
  id: string;
  status: RunStatus;
  summary: string | null;
  targets_found: number | null;
  created_at: string;
  completed_at: string | null;
  error: string | null;
};

type Cohort = 'healthy' | 'patient' | 'both' | 'unspecified';

type Target = {
  id: string;
  cohort: Cohort | string | null;
  kind: string | null;
  name: string;
  region: string | null;
  url: string | null;
  fit_score: number | null;
  size_estimate: string | null;
  accessibility: string | null;
  trust: string | null;
  rationale: string | null;
  contact_hint: string | null;
  status: string | null;
};

// ─── Labels & helpers ───────────────────────────────────────────────────────

const KIND_LABELS: Record<string, string> = {
  online_community:  'Online communities',
  forum:             'Forums',
  advocacy:          'Advocacy groups',
  creator:           'Creators',
  hospital:          'Hospitals',
  clinic:            'Clinics',
  old_age_home:      'Care / old-age homes',
  patient_group:     'Patient groups',
  doctor:            'Doctor networks',
  clinical_operator: 'Clinical operators',
  registry:          'Registries',
  regional:          'Regional',
  other:             'Other',
};

const KIND_ORDER = Object.keys(KIND_LABELS);

function kindLabel(kind: string | null): string {
  if (!kind) return KIND_LABELS.other;
  return KIND_LABELS[kind] ?? KIND_LABELS.other;
}

const COHORT_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  healthy:     { bg: 'var(--teal-soft)',        color: 'var(--teal-dark)', border: '1px solid rgba(14,116,144,0.2)', label: 'Healthy' },
  patient:     { bg: 'rgba(217,119,6,0.08)',    color: '#b45309',          border: '1px solid rgba(217,119,6,0.25)', label: 'Patient' },
  both:        { bg: 'rgba(2,132,199,0.08)',    color: '#0369a1',          border: '1px solid rgba(2,132,199,0.25)', label: 'Both' },
  unspecified: { bg: 'var(--bg-page)',          color: 'var(--slate)',     border: '1px solid var(--border-mid)',    label: 'Unspecified' },
};

function cohortStyle(c: string | null) {
  return COHORT_STYLE[c ?? 'unspecified'] ?? COHORT_STYLE.unspecified;
}

function clampPct(n: number | null): number {
  if (n === null || Number.isNaN(n)) return 0;
  if (n <= 1) return Math.round(n * 100);
  return Math.max(0, Math.min(100, Math.round(n)));
}

function Chip({ label }: { label: string }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.5px',
      padding: '2px 8px', borderRadius: 4, color: 'var(--slate)',
      background: 'var(--bg-page)', border: '1px solid var(--border-soft)', whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function RecruitmentViewerPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user, ready, authenticated } = usePrivy();

  const [run,      setRun]      = useState<FindRun | null>(null);
  const [targets,  setTargets]  = useState<Target[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [running,  setRunning]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res  = await fetch(`/api/agent/find?experimentId=${encodeURIComponent(id)}`);
      const data = await res.json() as { run?: FindRun | null; targets?: Target[] };
      setRun(data.run ?? null);
      setTargets(data.targets ?? []);
    } catch {
      setError('Failed to load recruitment intelligence.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, load]);

  async function runAgent() {
    if (!user) return;
    setRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/agent/find', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ experimentId: id, operatorPrivyDid: user.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setError(data.error ?? 'Find agent failed — please retry.');
        return;
      }
      await load();
    } catch {
      setError('Find agent failed — please retry.');
    } finally {
      setRunning(false);
    }
  }

  // ── Loading / auth gate ──
  if (!ready || loading) {
    return (
      <>
        <SiteHeader />
        <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)' }}>Loading…</span>
        </main>
      </>
    );
  }

  if (!authenticated || !user) {
    return (
      <>
        <SiteHeader />
        <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)' }}>
            Please sign in to view recruitment intelligence.
          </p>
        </main>
      </>
    );
  }

  const status: RunStatus | null = run?.status ?? null;
  const showRunPrompt = run === null || status === 'queued';
  const isRunning = status === 'running' || running;

  // Group complete targets by kind, sorted within group by fit_score desc.
  const grouped = (() => {
    const map = new Map<string, Target[]>();
    for (const t of targets) {
      const key = t.kind && KIND_LABELS[t.kind] ? t.kind : 'other';
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => clampPct(b.fit_score) - clampPct(a.fit_score));
    }
    return KIND_ORDER
      .filter((k) => map.has(k))
      .map((k) => ({ kind: k, label: KIND_LABELS[k], items: map.get(k)! }));
  })();

  return (
    <>
      <SiteHeader />
      <main style={{ minHeight: '100vh', background: 'var(--bg-page)', padding: '32px 16px 64px' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>

          {/* Back link */}
          <Link href={`/dashboard/experiments/${id}`} className="no-underline"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', display: 'inline-block', marginBottom: 20 }}>
            ← Back to study
          </Link>

          {/* Header */}
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--teal)', margin: '0 0 8px' }}>
            Stage 0
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--ink)', margin: '0 0 6px' }}>
            Recruitment intelligence
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)', margin: '0 0 28px' }}>
            Where BIOME is finding people and partners for your study.
          </p>

          {error && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#b91c1c', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-sm)', padding: '11px 16px', marginBottom: 20 }}>
              {error}
            </div>
          )}

          {/* ── Run prompt (queued / no run) ── */}
          {showRunPrompt && !isRunning && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', padding: '32px 28px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: '0 0 8px' }}>
                Stage 0 find agent is ready to run
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)', margin: '0 0 20px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
                The find agent maps online communities, patient groups, clinics, and other outreach targets that fit
                your study. This can take 30–60 seconds.
              </p>
              <button
                onClick={runAgent}
                className="transition-all hover:opacity-90"
                style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, padding: '11px 26px', borderRadius: 'var(--radius-sm)', background: 'var(--teal)', color: '#ffffff', border: 'none', cursor: 'pointer' }}>
                Run find agent →
              </button>
            </div>
          )}

          {/* ── Running ── */}
          {isRunning && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', padding: '32px 28px', textAlign: 'center' }}>
              <div aria-hidden="true" style={{
                width: 28, height: 28, margin: '0 auto 16px',
                border: '3px solid var(--teal-soft)', borderTopColor: 'var(--teal)',
                borderRadius: '50%', animation: 'biome-spin 0.8s linear infinite',
              }} />
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: 'var(--ink)', margin: '0 0 6px' }}>
                Find agent is running…
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)', margin: '0 0 18px' }}>
                Mapping outreach targets. This can take 30–60 seconds.
              </p>
              <button
                onClick={() => { void load(); }}
                className="transition-all hover:opacity-80"
                style={{ fontFamily: 'var(--font-body)', fontSize: 13, padding: '8px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-mid)', color: 'var(--slate)', background: 'var(--surface)', cursor: 'pointer' }}>
                Refresh
              </button>
              <style>{`@keyframes biome-spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* ── Failed ── */}
          {!isRunning && status === 'failed' && (
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', padding: '28px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: '#b91c1c', margin: '0 0 8px' }}>
                Find agent failed
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--slate)', margin: '0 0 20px' }}>
                {run?.error ?? 'An unknown error occurred.'}
              </p>
              <button
                onClick={runAgent}
                className="transition-all hover:opacity-90"
                style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, padding: '10px 24px', borderRadius: 'var(--radius-sm)', background: 'var(--teal)', color: '#ffffff', border: 'none', cursor: 'pointer' }}>
                Retry →
              </button>
            </div>
          )}

          {/* ── Complete ── */}
          {!isRunning && status === 'complete' && (
            <>
              {run?.summary && (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', padding: '20px 24px', marginBottom: 24 }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 8px' }}>
                    Summary · {run.targets_found ?? targets.length} targets found
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)', lineHeight: 1.65, margin: 0 }}>
                    {run.summary}
                  </p>
                </div>
              )}

              {targets.length === 0 ? (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', padding: '32px', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted)', margin: 0 }}>
                    No outreach targets were found for this study.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  {grouped.map((group) => (
                    <section key={group.kind}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--ink)', margin: 0 }}>
                          {group.label}
                        </h2>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)' }}>[{group.items.length}]</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                        {group.items.map((t) => {
                          const cs  = cohortStyle(typeof t.cohort === 'string' ? t.cohort : null);
                          const pct = clampPct(t.fit_score);
                          return (
                            <div key={t.id} style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                                <div style={{ minWidth: 0 }}>
                                  {t.url ? (
                                    <a href={t.url} target="_blank" rel="noopener noreferrer"
                                      style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--teal-dark)', textDecoration: 'none' }}>
                                      {t.name} ↗
                                    </a>
                                  ) : (
                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                                      {t.name}
                                    </span>
                                  )}
                                  {t.region && (
                                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', margin: '2px 0 0' }}>
                                      {t.region}
                                    </p>
                                  )}
                                </div>
                                <span style={{
                                  fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.5px',
                                  padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0,
                                  background: cs.bg, color: cs.color, border: cs.border,
                                }}>
                                  {cs.label}
                                </span>
                              </div>

                              {/* Fit score bar */}
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fit</span>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--teal-dark)' }}>{pct}%</span>
                                </div>
                                <div style={{ height: 5, borderRadius: 999, background: 'var(--border-soft)', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${pct}%`, background: 'var(--teal)', borderRadius: 999 }} />
                                </div>
                              </div>

                              {(t.accessibility || t.trust || t.size_estimate) && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {t.accessibility && <Chip label={`Access: ${t.accessibility}`} />}
                                  {t.trust && <Chip label={`Trust: ${t.trust}`} />}
                                  {t.size_estimate && <Chip label={`Size: ${t.size_estimate}`} />}
                                </div>
                              )}

                              {t.rationale && (
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)', lineHeight: 1.55, margin: 0 }}>
                                  {t.rationale}
                                </p>
                              )}

                              {t.contact_hint && (
                                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                                  <span style={{ color: 'var(--slate)' }}>Contact:</span> {t.contact_hint}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </>
  );
}
