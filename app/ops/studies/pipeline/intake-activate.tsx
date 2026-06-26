'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { OpsButton } from '../../_components/ui';

export function IntakeActivate({
  intakeId,
  convertedExperimentId,
}: {
  intakeId: string;
  convertedExperimentId: string | null;
}) {
  const router = useRouter();
  const { user } = usePrivy();
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newId, setNewId] = useState<string | null>(null);

  // Already activated (server) or just activated (this session) → show the study link.
  const studyId = convertedExperimentId ?? newId;
  if (studyId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#15803d', fontWeight: 600 }}>
          ✓ Activated as study
        </span>
        <OpsButton href={`/experiments/${studyId}`} variant="ghost">
          View study →
        </OpsButton>
      </div>
    );
  }

  async function activate() {
    if (!user) { setError('Not signed in'); return; }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/ops/intakes/activate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ intakeId, operatorPrivyDid: user.id }),
      });
      const data = (await res.json()) as { experimentId?: string; error?: string };
      if (!res.ok || !data.experimentId) {
        setError(data.error ?? 'Activation failed');
        return;
      }
      setNewId(data.experimentId);
      router.refresh(); // re-render the server pipeline so the badge flips to "converted"
    } catch {
      setError('Network error — try again');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <OpsButton onClick={() => void activate()} disabled={busy}>
        {busy ? 'Activating…' : 'Activate → Create Study'}
      </OpsButton>
      {error && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#b91c1c' }}>
          {error}
        </span>
      )}
    </div>
  );
}

// Inline link variant for re-use elsewhere if needed.
export function StudyLink({ experimentId }: { experimentId: string }) {
  return (
    <Link href={`/experiments/${experimentId}`} style={{ color: 'var(--teal-dark)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
      View study →
    </Link>
  );
}
