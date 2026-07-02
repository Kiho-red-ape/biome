'use client';

import { useState, useEffect } from 'react';
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
  const [freeStudyUsed, setFreeStudyUsed] = useState(false);

  const isOwner = authenticated && !!user && user.id === experimenterUserId;

  // Fetch free_study_used when owner views draft
  useEffect(() => {
    if (!isOwner || !user) return;
    fetch(`/api/experimenter-profile?privyDid=${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then((data: { profile?: { free_study_used?: boolean } | null }) => {
        setFreeStudyUsed(data.profile?.free_study_used ?? false);
      })
      .catch(() => { /* ignore */ });
  }, [isOwner, user]);

  if (!isOwner) {
    return (
      <div
        className="px-6 py-3 flex items-center gap-3"
        style={{ background: 'var(--warning-soft)', borderBottom: '1px solid rgba(180,83,9,0.2)' }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--warning)' }}>● Draft</span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)' }}>
          This study is saved as a draft and not publicly listed.
        </span>
      </div>
    );
  }

  return (
    <>
      <div
        className="px-6 py-3 flex items-center justify-between gap-4 flex-wrap"
        style={{ background: 'var(--warning-soft)', borderBottom: '1px solid rgba(180,83,9,0.2)' }}
      >
        <div className="flex items-center gap-3">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--warning)' }}>● Draft</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)' }}>
            This study is saved as a draft. Publish it to start recruiting participants.
          </span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="transition-all hover:opacity-90"
          style={{
            fontFamily:   'var(--font-body)',
            fontSize:     13,
            fontWeight:   600,
            padding:      '8px 16px',
            borderRadius: 'var(--radius-sm)',
            background:   'var(--teal)',
            border:       '1px solid var(--teal)',
            color:        '#ffffff',
            cursor:       'pointer',
          }}
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
          freeStudyUsed={freeStudyUsed}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
