'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { OpsButton } from '../../_components/ui';

// Replaces the old auto-create "Activate": ops invites the real researcher to
// self-onboard and build their org profile + study.
export function IntakeInvite({
  intakeId,
  email,
  invited,
  converted,
}: {
  intakeId: string;
  email: string | null;
  invited: boolean;
  converted: boolean;
}) {
  const router = useRouter();
  const { user } = usePrivy();
  const [busy, setBusy]   = useState(false);
  const [sent, setSent]   = useState(invited);
  const [link, setLink]   = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (converted) {
    return (
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#15803d', fontWeight: 600 }}>
        ✓ Researcher onboarded
      </span>
    );
  }

  async function invite() {
    if (!user) { setError('Not signed in'); return; }
    if (!email) { setError('No email on this intake'); return; }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/ops/intakes/invite', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ intakeId, operatorPrivyDid: user.id }),
      });
      const data = (await res.json()) as { link?: string; error?: string };
      if (!res.ok || !data.link) { setError(data.error ?? 'Failed to send invite'); return; }
      setSent(true);
      setLink(data.link);
      router.refresh();
    } catch {
      setError('Network error — try again');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <OpsButton onClick={() => void invite()} disabled={busy} variant={sent ? 'ghost' : 'primary'}>
        {busy ? 'Sending…' : sent ? 'Resend invite' : 'Invite to onboard'}
      </OpsButton>
      {sent && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal-dark)' }}>
          Invite sent{email ? ` → ${email}` : ''}
        </span>
      )}
      {link && (
        <button
          onClick={() => void navigator.clipboard.writeText(link)}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)', background: 'none', border: '1px solid var(--border-mid)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}
        >
          Copy link
        </button>
      )}
      {error && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#b91c1c' }}>{error}</span>}
    </div>
  );
}
