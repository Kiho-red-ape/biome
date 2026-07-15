'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { SiteHeader } from '@/components/nav/header';
import { DashCard, CardLabel } from '@/components/dashboard/card';

// ─── Types (mirror /api/org contract exactly) ──────────────────────────────────

type CallerRole = 'admin' | 'clinical_operator' | 'researcher' | 'sponsor';

type Member = {
  id: string;
  email: string;
  role: string;
  status: string;
  pending: boolean;
  invitedAt: string | null;
  acceptedAt: string | null;
};

type Org = {
  id: string;
  orgName: string;
  website: string | null;
  description: string | null;
  screeningStatus: string;
  reviewStatus: string;
  studyCount: number;
};

type OrgResponse = {
  org: Org | null;
  callerRole: CallerRole;
  isAdmin: boolean;
  members: Member[];
};

const INVITE_ROLES = ['clinical_operator', 'researcher', 'sponsor'] as const;
type InviteRole = (typeof INVITE_ROLES)[number];

const ROLE_LABELS: Record<string, string> = {
  admin:             'Admin',
  clinical_operator: 'Clinical Operator',
  researcher:        'Researcher',
  sponsor:           'Sponsor',
};

function roleLabel(role: string) {
  return ROLE_LABELS[role] ?? role.replace(/_/g, ' ');
}

// review_status pill colours
function reviewStyle(status: string): { color: string; bg: string; label: string } {
  if (status === 'active')        return { color: 'var(--teal-dark)', bg: 'var(--teal-faint)', label: 'Active' };
  if (status === 'rejected')      return { color: '#dc2626',          bg: '#fef2f2',           label: 'Rejected' };
  // pending_review / anything else → amber-ish slate
  return { color: '#b45309', bg: '#fef9ec', label: status === 'pending_review' ? 'Pending review' : status.replace(/_/g, ' ') };
}

// ─── Small UI atoms ─────────────────────────────────────────────────────────────

function Pill({ color, bg, children }: { color: string; bg: string; children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
      letterSpacing: '0.5px', textTransform: 'uppercase',
      color, background: bg,
      borderRadius: 999, padding: '4px 10px', whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)',
  background: 'var(--surface)', border: '1px solid var(--border-mid)',
  borderRadius: 'var(--radius-sm)', padding: '10px 12px', width: '100%',
  outline: 'none', minHeight: 42,
};

function shell(children: React.ReactNode) {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <SiteHeader />
      {children}
    </main>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function OrgConsolePage() {
  const router = useRouter();
  const { user, ready, authenticated } = usePrivy();

  const [data,    setData]    = useState<OrgResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole,  setInviteRole]  = useState<InviteRole>('researcher');
  const [inviting,    setInviting]    = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLink,  setInviteLink]  = useState<string | null>(null);
  const [copied,      setCopied]      = useState(false);

  // per-member action state
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/org?privyDid=${encodeURIComponent(user.id)}`);
      const json = (await res.json()) as OrgResponse;
      setData(json);
    } catch {
      setError('Failed to load organization');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user) { router.replace('/'); return; }
    void load();
  }, [ready, authenticated, user, router, load]);

  async function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!user || inviting) return;
    setInviting(true);
    setInviteError(null);
    setInviteLink(null);
    setCopied(false);
    try {
      const res = await fetch('/api/org/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privyDid: user.id, email: inviteEmail.trim(), role: inviteRole }),
      });
      const json = (await res.json()) as { ok?: boolean; link?: string; error?: string };
      if (!res.ok || !json.ok) {
        setInviteError(json.error ?? (res.status === 403 ? 'Only the org admin can invite teammates' : 'Could not send invite'));
        return;
      }
      setInviteLink(json.link ?? null);
      setInviteEmail('');
      await load();
    } catch {
      setInviteError('Could not send invite');
    } finally {
      setInviting(false);
    }
  }

  async function patchMember(memberId: string, body: { role?: string; remove?: true }) {
    if (!user || rowBusy) return;
    setRowBusy(memberId);
    try {
      const res = await fetch('/api/org/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privyDid: user.id, memberId, ...body }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setError(json.error ?? 'Could not update member');
      } else {
        await load();
      }
    } catch {
      setError('Could not update member');
    } finally {
      setRowBusy(null);
    }
  }

  function copyLink() {
    if (!inviteLink) return;
    navigator.clipboard?.writeText(inviteLink).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 2000); },
      () => {},
    );
  }

  // ── Loading ──
  if (!ready || loading) {
    return shell(
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted)' }}>
          Loading organization...
        </span>
      </div>,
    );
  }

  // ── Error ──
  if (error && !data) {
    return shell(
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#dc2626' }}>Error: {error}</p>
      </div>,
    );
  }

  // ── No org ──
  if (!data || data.org === null) {
    return shell(
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border-soft)',
          borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)',
          padding: '56px 32px', textAlign: 'center',
        }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
            Organization
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--ink)', margin: '0 0 12px' }}>
            No organization yet
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)', lineHeight: 1.6, maxWidth: 440, margin: '0 auto 22px' }}>
            Set up your organization to post studies, manage your team, and track recruitment from one console.
          </p>
          <Link href="/onboarding/experimenter" className="no-underline transition-opacity hover:opacity-90"
            style={{ display: 'inline-block', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, padding: '11px 20px', borderRadius: 'var(--radius-sm)', background: 'var(--teal)', color: '#ffffff' }}>
            Set up your organization →
          </Link>
        </div>
      </div>,
    );
  }

  // ── Console ──
  const { org, callerRole, isAdmin, members } = data;
  const rv = reviewStyle(org.reviewStatus);
  const activeMembers  = members.filter((m) => m.status !== 'removed');
  const pendingCount   = activeMembers.filter((m) => m.pending).length;
  const memberCount    = activeMembers.length;

  return shell(
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px 80px' }}>

      {/* Header card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border-soft)',
        borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)',
        padding: '28px 28px', marginBottom: 24,
      }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
          Organization
        </p>
        <div className="flex items-start justify-between flex-wrap gap-3" style={{ marginBottom: 12 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: 'var(--ink)', lineHeight: 1.15, margin: 0 }}>
            {org.orgName}
          </h1>
          <div className="flex items-center" style={{ gap: 8, flexWrap: 'wrap' }}>
            <Pill color={rv.color} bg={rv.bg}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: rv.color, display: 'inline-block' }} />
              {rv.label}
            </Pill>
            <Pill color="var(--teal-dark)" bg="var(--teal-faint)">{roleLabel(callerRole)}</Pill>
          </div>
        </div>

        {org.description && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)', lineHeight: 1.6, margin: '0 0 16px', maxWidth: 640 }}>
            {org.description}
          </p>
        )}

        <div className="flex items-center" style={{ gap: 18, flexWrap: 'wrap' }}>
          <Link href="/dashboard/experiments" className="no-underline transition-opacity hover:opacity-80"
            style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--teal-dark)' }}>
            Researcher Dashboard →
          </Link>
          <Link href="/post" className="no-underline transition-opacity hover:opacity-80"
            style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--teal-dark)' }}>
            Post a Study →
          </Link>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-0"
        style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', background: 'var(--surface)', overflow: 'hidden', marginBottom: 24 }}>
        {[
          { label: 'Studies',        value: String(org.studyCount) },
          { label: 'Team members',   value: String(memberCount) },
          { label: 'Pending invites', value: String(pendingCount) },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: '20px', borderBottom: '1px solid var(--border-soft)' }}
            className={i < 2 ? 'sm:border-b-0 sm:border-r' : 'sm:border-b-0'}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>{s.label}</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 22, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Team card */}
      <DashCard>
        <CardLabel>Team</CardLabel>

        {/* Invite form (admin only) */}
        {isAdmin && (
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-soft)', background: 'var(--teal-faint)' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--slate)', marginBottom: 12 }}>
              Invite teammate
            </p>
            <form onSubmit={submitInvite} className="flex flex-col sm:flex-row" style={{ gap: 10, alignItems: 'stretch' }}>
              <input
                type="email"
                required
                placeholder="teammate@org.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                style={{ ...inputStyle, flex: 2 }}
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as InviteRole)}
                style={{ ...inputStyle, flex: 1 }}
              >
                <option value="clinical_operator">Clinical Operator</option>
                <option value="researcher">Researcher</option>
                <option value="sponsor">Sponsor</option>
              </select>
              <button
                type="submit"
                disabled={inviting}
                className="transition-opacity hover:opacity-90"
                style={{
                  fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
                  padding: '10px 18px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--teal)', color: '#ffffff', border: 'none',
                  cursor: inviting ? 'default' : 'pointer', opacity: inviting ? 0.6 : 1,
                  minHeight: 42, whiteSpace: 'nowrap',
                }}>
                {inviting ? 'Sending...' : 'Send invite'}
              </button>
            </form>

            {inviteError && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#dc2626', margin: '10px 0 0' }}>{inviteError}</p>
            )}

            {inviteLink && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--teal-soft)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginTop: 12 }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 6px' }}>
                  Invite link
                </p>
                <div className="flex items-center" style={{ gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--teal-dark)', wordBreak: 'break-all', flex: 1, minWidth: 0 }}>
                    {inviteLink}
                  </span>
                  <button onClick={copyLink}
                    className="transition-opacity hover:opacity-80"
                    style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--teal-dark)', background: 'var(--surface)', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Roster */}
        {activeMembers.length === 0 ? (
          <div className="text-center" style={{ padding: '48px 24px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)', margin: 0 }}>
              No team members yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: isAdmin ? 640 : 420 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-soft)', background: 'var(--bg-page)' }}>
                  {['Member', 'Role', 'Status', ...(isAdmin ? [''] : [])].map((h, i) => (
                    <th key={i} className="text-left"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)', padding: '12px 16px' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeMembers.map((m, idx) => {
                  const isAdminRow = m.role === 'admin';
                  const busy = rowBusy === m.id;
                  return (
                    <tr key={m.id} style={{ borderBottom: idx < activeMembers.length - 1 ? '1px solid var(--border-soft)' : 'none', opacity: busy ? 0.5 : 1 }}>
                      <td style={{ padding: '16px' }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)', wordBreak: 'break-all' }}>
                          {m.email}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        {isAdmin && !isAdminRow ? (
                          <select
                            value={m.role}
                            disabled={busy}
                            onChange={(e) => patchMember(m.id, { role: e.target.value })}
                            style={{ ...inputStyle, padding: '6px 10px', minHeight: 34, fontSize: 13, width: 'auto', minWidth: 150 }}
                          >
                            <option value="clinical_operator">Clinical Operator</option>
                            <option value="researcher">Researcher</option>
                            <option value="sponsor">Sponsor</option>
                          </select>
                        ) : (
                          <Pill color="var(--teal-dark)" bg="var(--teal-faint)">{roleLabel(m.role)}</Pill>
                        )}
                      </td>
                      <td style={{ padding: '16px' }}>
                        {m.pending ? (
                          <Pill color="#b45309" bg="#fef9ec">
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#b45309', display: 'inline-block' }} />
                            Pending
                          </Pill>
                        ) : (
                          <Pill color="var(--teal-dark)" bg="var(--teal-faint)">
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal-dark)', display: 'inline-block' }} />
                            Active
                          </Pill>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="text-right" style={{ padding: '16px' }}>
                          {!isAdminRow && (
                            <button
                              onClick={() => patchMember(m.id, { remove: true })}
                              disabled={busy}
                              className="transition-opacity hover:opacity-80"
                              style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#dc2626', background: 'var(--surface)', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', cursor: busy ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
                              Remove
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DashCard>
    </div>,
  );
}
