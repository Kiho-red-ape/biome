'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { PublishFlowModal } from './publish-flow-modal';

interface Props {
  experimentId: string;
  experimenterUserId: string;
  experimentTitle: string;
  category: string;
  reward: number;
  slots: number;
  durationWeeks: number | null;
}

export function DraftBanner({
  experimentId, experimenterUserId, experimentTitle,
  category, reward, slots, durationWeeks,
}: Props) {
  const { user, authenticated } = usePrivy();
  const [showModal, setShowModal] = useState(false);

  const isOwner = authenticated && !!user && user.id === experimenterUserId;

  if (!isOwner) {
    return (
      <div
        className="px-6 py-3 flex items-center gap-3"
        style={{ background: 'rgba(255,179,0,0.07)', borderBottom: '1px solid rgba(255,179,0,0.2)' }}
      >
        <span className="mono text-xs font-bold" style={{ color: 'var(--amber)' }}>● DRAFT</span>
        <span className="text-sm" style={{ color: 'var(--text-dim)' }}>
          This study is saved as a draft and not publicly listed.
        </span>
      </div>
    );
  }

  return (
    <>
      <div
        className="px-6 py-3 flex items-center justify-between gap-4 flex-wrap"
        style={{ background: 'rgba(255,179,0,0.07)', borderBottom: '1px solid rgba(255,179,0,0.2)' }}
      >
        <div className="flex items-center gap-3">
          <span className="mono text-xs font-bold" style={{ color: 'var(--amber)' }}>● DRAFT</span>
          <span className="text-sm" style={{ color: 'var(--text-dim)' }}>
            This study is saved as a draft. Publish it to start recruiting participants.
          </span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="mono text-xs px-4 py-2 rounded font-bold transition-all hover:opacity-90"
          style={{ background: 'var(--green)', color: '#050709' }}
        >
          Publish study →
        </button>
      </div>

      {showModal && (
        <PublishFlowModal
          experimentId={experimentId}
          privyDid={user!.id}
          experimentTitle={experimentTitle}
          category={category}
          reward={reward}
          slots={slots}
          durationWeeks={durationWeeks}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
