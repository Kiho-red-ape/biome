'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';

interface Props {
  experimentId: string;
  experimenterUserId: string;
}

export function DraftBanner({ experimentId, experimenterUserId }: Props) {
  const { user, authenticated } = usePrivy();
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show publish button to the owner
  const isOwner = authenticated && !!user && user.id === experimenterUserId;

  async function handlePublish() {
    if (!user) return;
    setPublishing(true); setError(null);

    const res = await fetch(`/api/experiments/${experimentId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ privyDid: user.id, action: 'publish' }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? 'Failed to publish');
      setPublishing(false);
    }
  }

  return (
    <div
      className="px-6 py-3 flex items-center justify-between gap-4 flex-wrap"
      style={{ background: 'rgba(255,179,0,0.07)', borderBottom: '1px solid rgba(255,179,0,0.2)' }}
    >
      <div className="flex items-center gap-3">
        <span className="mono text-xs font-bold" style={{ color: 'var(--amber)' }}>
          ● DRAFT
        </span>
        <span className="text-sm" style={{ color: 'var(--text-dim)' }}>
          This study is saved as a draft and not publicly listed.
        </span>
      </div>

      {isOwner && (
        <div className="flex items-center gap-3">
          {error && (
            <span className="mono text-xs" style={{ color: 'var(--amber)' }}>{error}</span>
          )}
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="mono text-xs px-4 py-2 rounded font-bold transition-all disabled:opacity-40 hover:opacity-90"
            style={{ background: 'var(--green)', color: '#050709' }}
          >
            {publishing ? 'Publishing...' : 'Publish study →'}
          </button>
        </div>
      )}
    </div>
  );
}
