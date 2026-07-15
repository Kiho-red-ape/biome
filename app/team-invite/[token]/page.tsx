'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { SiteHeader } from '@/components/nav/header';

type InviteInfo =
  | { valid: true; email: string; role: string; orgName: string }
  | { valid: false; reason: string };

const ROLE_LABELS: Record<string, string> = {
  admin:             'Admin',
  clinical_operator: 'Clinical Operator',
  researcher:        'Researcher',
  sponsor:           'Sponsor',
};

function roleLabel(role: string) {
  return ROLE_LABELS[role] ?? role.replace(/_/g, ' ');
}

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border-soft)',
  borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', padding: 36,
  maxWidth: 520, width: '100%',
};

export default function TeamInviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { ready, authenticated, login, user } = usePrivy();

  const [info,      setInfo]      = useState<InviteInfo | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/team-invite/${token}`)
      .then((r) => r.json())
      .then((d: InviteInfo) => setInfo(d))
      .catch(() => setInfo({ valid: false, reason: 'error' }));
  }, [token]);

  async function accept() {
    if (!user || accepting) return;
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch(`/api/team-invite/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privyDid: user.id }),
      });
      const json = (await res.json()) as { ok?: boolean; orgId?: string; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? 'Could not accept invitation');
        return;
      }
      router.push('/dashboard/org');
    } catch {
      setError('Could not accept invitation');
    } finally {
      setAccepting(false);
    }
  }

  const shell = (children: React.ReactNode) => (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <SiteHeader />
      <div style={{ display: 'flex', justifyContent: 'center', padding: '56px 20px' }}>
        <div style={card}>{children}</div>
      </div>
    </main>
  );

  if (!info) return shell(<span style={{ fontFamily: 'var(--font-body)', color: 'var(--muted)' }}>Loading invitation…</span>);

  if (!info.valid) {
    const msg = info.reason === 'removed' ? 'This invitation is no longer active.'
      : info.reason === 'active' ? 'This invitation has already been accepted.'
      : info.reason === 'not_found' ? 'We could not find this invitation.'
      : 'This invitation is unavailable.';
    return shell(
      <>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink)', margin: 0 }}>Invitation unavailable</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)', marginTop: 12 }}>{msg}</p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>
          Reach out to <a href="mailto:hello@biome.to" style={{ color: 'var(--teal-dark)' }}>hello@biome.to</a> and we will send a fresh link.
        </p>
      </>,
    );
  }

  return shell(
    <>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--teal-dark)', margin: 0 }}>
        Team invitation
      </p>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--ink)', margin: '8px 0 0' }}>
        Join {info.orgName} as {roleLabel(info.role)}
      </h1>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)', lineHeight: 1.6, marginTop: 12 }}>
        You&apos;ve been invited to join {info.orgName} on BIOME. Accept to access the organization console, studies, and team tools.
      </p>
      <div style={{ background: 'var(--teal-faint)', border: '1px solid var(--teal-soft)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginTop: 16 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>Invited email</span>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)', fontWeight: 600 }}>{info.email}</div>
      </div>

      {error && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#dc2626', marginTop: 14 }}>{error}</p>
      )}

      {!ready ? (
        <p style={{ marginTop: 20, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>…</p>
      ) : authenticated ? (
        <button onClick={accept} disabled={accepting} className="btn-primary" style={{ marginTop: 22, width: '100%', opacity: accepting ? 0.6 : 1 }}>
          {accepting ? 'Accepting…' : 'Accept invitation →'}
        </button>
      ) : (
        <>
          <button onClick={login} className="btn-primary" style={{ marginTop: 22, width: '100%' }}>
            Sign in to accept →
          </button>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--muted)', marginTop: 10, textAlign: 'center' }}>
            Use the invited email address so we can match your invitation.
          </p>
        </>
      )}
    </>,
  );
}
