'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { SiteHeader } from '@/components/nav/header';

type InviteInfo =
  | { valid: true; email: string; orgName: string | null; contactName: string | null }
  | { valid: false; reason: string; orgId?: string };

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border-soft)',
  borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', padding: 36,
  maxWidth: 520, width: '100%',
};

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { ready, authenticated, login } = usePrivy();
  const [info, setInfo] = useState<InviteInfo | null>(null);

  useEffect(() => {
    fetch(`/api/invites/${token}`)
      .then((r) => r.json())
      .then((d: InviteInfo) => setInfo(d))
      .catch(() => setInfo({ valid: false, reason: 'error' }));
  }, [token]);

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
    if (info.reason === 'accepted') {
      return shell(
        <>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink)', margin: 0 }}>Invitation already used</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)', marginTop: 12 }}>
            This organization is already set up.
          </p>
          <button onClick={() => router.push('/dashboard/experiments')} className="btn-primary" style={{ marginTop: 20 }}>
            Go to researcher dashboard →
          </button>
        </>,
      );
    }
    const msg = info.reason === 'expired' ? 'This invitation has expired.'
      : info.reason === 'revoked' ? 'This invitation is no longer active.'
      : 'We could not find this invitation.';
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
        Organization invitation
      </p>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--ink)', margin: '8px 0 0' }}>
        Set up {info.orgName ?? 'your organization'} on BIOME
      </h1>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)', lineHeight: 1.6, marginTop: 12 }}>
        {info.contactName ? `${info.contactName}, you` : 'You'}&apos;ve been invited to create your organization profile. Once it&apos;s set up you can post and manage your study, attach approval documents, and invite your team.
      </p>
      <div style={{ background: 'var(--teal-faint)', border: '1px solid var(--teal-soft)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginTop: 16 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>Invited email</span>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)', fontWeight: 600 }}>{info.email}</div>
      </div>

      {!ready ? (
        <p style={{ marginTop: 20, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>…</p>
      ) : authenticated ? (
        <button onClick={() => router.push(`/onboarding/experimenter?invite=${token}`)} className="btn-primary" style={{ marginTop: 22, width: '100%' }}>
          Set up my organization →
        </button>
      ) : (
        <>
          <button onClick={login} className="btn-primary" style={{ marginTop: 22, width: '100%' }}>
            Sign in with {info.email} to continue →
          </button>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--muted)', marginTop: 10, textAlign: 'center' }}>
            Use the invited email address so we can match your invitation.
          </p>
        </>
      )}
    </>,
  );
}
