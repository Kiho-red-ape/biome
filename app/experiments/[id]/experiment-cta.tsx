'use client';

import { useState, useEffect, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type ApplicationStatus = 'applied' | 'approved' | 'waitlisted' | 'enrolled' | 'active' | 'completed' | 'rejected' | 'withdrawn';

interface ApplicationData {
  id: string;
  status: ApplicationStatus;
  applied_at: string;
  payout_status: string;
  eligibility_status: string | null;
}

interface Props {
  experimentId: string;
  experimentStatus: string;
  slotsLeft: number;
  deadlineClosed: boolean;
  // Protocol review props
  protocolText: string | null;
  description: string;
  durationWeeks: number | null;
  milestoneCount: number;
  complianceThreshold: number;
  orgName: string;
  experimentTitle: string;
}

const LABEL_STYLE = {
  fontFamily: 'var(--font-mono)', fontSize: 11,
  textTransform: 'uppercase' as const, letterSpacing: '2px',
};

// ─── Protocol review modal ─────────────────────────────────────────────────────

function ProtocolModal({
  experimentId,
  experimentTitle,
  orgName,
  protocolText,
  description,
  durationWeeks,
  milestoneCount,
  complianceThreshold,
  slotsLeft,
  onClose,
}: {
  experimentId: string;
  experimentTitle: string;
  orgName: string;
  protocolText: string | null;
  description: string;
  durationWeeks: number | null;
  milestoneCount: number;
  complianceThreshold: number;
  slotsLeft: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [checked,       setChecked]       = useState(false);
  const [scrolledFully, setScrolledFully] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const canApply = checked && scrolledFully;

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;
    if (atBottom) setScrolledFully(true);
  }

  // If content is short enough to not need scroll, unlock immediately
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight + 20) setScrolledFully(true);
  }, []);

  // Close on backdrop click
  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div style={{
        background: '#0d1117',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 24,
        width: '100%', maxWidth: 600,
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        gap: 0,
      }}>
        {/* Header */}
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px', color: '#4a7055', marginBottom: 10 }}>
          // STUDY_PROTOCOL_REVIEW
        </p>
        <h2 style={{
          fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700,
          color: '#eef4f0', marginBottom: 4, lineHeight: 1.2,
        }}>
          {experimentTitle}
        </h2>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4a7055', marginBottom: 20 }}>
          Posted by {orgName}
        </p>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 20 }} />

        {/* Protocol text — scrollable */}
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: '#7f8e87', marginBottom: 10 }}>
          Protocol Summary
        </p>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: '40vh',
            minHeight: 80,
            paddingRight: 8,
            marginBottom: 20,
          }}
        >
          <p style={{
            fontFamily: 'var(--font-heading)', fontSize: 14,
            color: '#aab8b1', lineHeight: 1.7, whiteSpace: 'pre-wrap',
          }}>
            {protocolText ?? description}
          </p>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 20 }} />

        {/* Commitment summary */}
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: '#7f8e87', marginBottom: 12 }}>
          What You&apos;re Committing To
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
          {[
            { label: 'Duration',    value: durationWeeks ? `${durationWeeks} weeks` : 'See protocol' },
            { label: 'Milestones',  value: milestoneCount > 0 ? `${milestoneCount} milestones total` : 'To be defined by researcher' },
            { label: 'Min. compliance for payout', value: `${complianceThreshold}%` },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4a7055' }}>{label}</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: '#aab8b1' }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 20 }} />

        {/* Scroll hint */}
        {!scrolledFully && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a7055', marginBottom: 12, textAlign: 'center' }}>
            ↑ Scroll through the protocol above to continue
          </p>
        )}

        {/* Checkbox */}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            disabled={!scrolledFully}
            style={{ marginTop: 2, accentColor: '#b7ff61', width: 16, height: 16, flexShrink: 0, cursor: scrolledFully ? 'pointer' : 'not-allowed' }}
          />
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: scrolledFully ? '#aab8b1' : '#4a7055', lineHeight: 1.5 }}>
            I have read and understood the study protocol and requirements.
          </span>
        </label>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            disabled={!canApply}
            onClick={() => { onClose(); router.push(`/experiments/${experimentId}/apply`); }}
            style={{
              flex: 1, height: 44, cursor: canApply ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '2px',
              background: canApply ? '#b7ff61' : 'rgba(183,255,97,0.1)',
              color: canApply ? '#050709' : '#4a7055',
              border: 'none', borderRadius: 6,
              transition: 'all 200ms',
            }}
          >
            Apply → ({slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} left)
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: '#4a7055', textTransform: 'uppercase', letterSpacing: '1px',
              padding: '0 8px',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main CTA ─────────────────────────────────────────────────────────────────

export function ExperimentCTA({
  experimentId, experimentStatus, slotsLeft, deadlineClosed,
  protocolText, description, durationWeeks, milestoneCount,
  complianceThreshold, orgName, experimentTitle,
}: Props) {
  const { authenticated, user, login, ready } = usePrivy();
  const [application,   setApplication]   = useState<ApplicationData | null | undefined>(undefined);
  const [loading,       setLoading]       = useState(false);
  const [showProtocol,  setShowProtocol]  = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user) { setApplication(null); return; }
    setLoading(true);
    fetch(`/api/experiments/${experimentId}/my-application?privyDid=${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then((json: { application: ApplicationData | null }) => setApplication(json.application))
      .catch(() => setApplication(null))
      .finally(() => setLoading(false));
  }, [ready, authenticated, user, experimentId]);

  const modalProps = {
    experimentId, experimentTitle, orgName, protocolText, description,
    durationWeeks, milestoneCount, complianceThreshold, slotsLeft,
    onClose: () => setShowProtocol(false),
  };

  if (!ready || loading || application === undefined) {
    return (
      <div style={{ width: '100%', height: 48, border: '1px solid rgba(77,255,128,0.06)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ ...LABEL_STYLE, color: '#4a7055' }}>—</span>
      </div>
    );
  }

  if (application) {
    const { status } = application;
    const dashboardLink = (
      <Link href="/dashboard" style={{ color: 'var(--green)', textDecoration: 'none', ...LABEL_STYLE, fontSize: 12 }}>
        Go to dashboard →
      </Link>
    );
    if (status === 'applied') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ width: '100%', padding: '14px 20px', border: '1px solid rgba(255,179,0,0.2)', borderRadius: 2, background: 'rgba(255,179,0,0.04)' }}>
            <p style={{ ...LABEL_STYLE, color: 'var(--amber)', marginBottom: 6 }}>Application under review</p>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: '#aab8b1' }}>Your application has been submitted. Track your status in your dashboard.</p>
          </div>
          {dashboardLink}
        </div>
      );
    }
    if (status === 'approved' || status === 'enrolled' || status === 'active') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ width: '100%', padding: '14px 20px', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 2, background: 'rgba(0,229,255,0.04)' }}>
            <p style={{ ...LABEL_STYLE, color: 'var(--cyan)', marginBottom: 6 }}>{status === 'approved' ? 'Accepted into this study' : 'Enrolled — study in progress'}</p>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: '#aab8b1' }}>Track milestones and progress in your dashboard.</p>
          </div>
          {dashboardLink}
        </div>
      );
    }
    if (status === 'waitlisted') {
      return (
        <div style={{ width: '100%', padding: '14px 20px', border: '1px solid rgba(160,92,16,0.25)', borderRadius: 2, background: 'rgba(160,92,16,0.04)' }}>
          <p style={{ ...LABEL_STYLE, color: '#a05c10', marginBottom: 4 }}>You&apos;re on the waitlist</p>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: '#aab8b1' }}>We&apos;ll notify you if a spot opens.</p>
        </div>
      );
    }
    if (status === 'rejected') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ width: '100%', padding: '14px 20px', border: '1px solid rgba(180,60,60,0.2)', borderRadius: 2, background: 'rgba(180,60,60,0.04)' }}>
            <p style={{ ...LABEL_STYLE, color: '#7a3535', marginBottom: 4 }}>Application not selected</p>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: '#aab8b1' }}>Your application was not selected for this study.</p>
          </div>
          <Link href="/experiments" style={{ color: '#4a7055', textDecoration: 'none', ...LABEL_STYLE, fontSize: 11 }}>Browse other studies →</Link>
        </div>
      );
    }
    if (status === 'completed') {
      return (
        <div style={{ width: '100%', padding: '14px 20px', border: '1px solid rgba(77,255,128,0.15)', borderRadius: 2, background: 'rgba(77,255,128,0.04)' }}>
          <p style={{ ...LABEL_STYLE, color: 'var(--green)', marginBottom: 4 }}>✓ You completed this study</p>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: '#aab8b1' }}>Check your earnings and compliance score in your{' '}<Link href="/dashboard" style={{ color: 'var(--green)' }}>dashboard</Link>.</p>
        </div>
      );
    }
  }

  if (experimentStatus === 'completed' || experimentStatus === 'cancelled') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ width: '100%', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', ...LABEL_STYLE, color: '#4a7055', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2 }}>This study has been completed</div>
        <Link href="/experiments" style={{ ...LABEL_STYLE, fontSize: 10, color: '#4a7055', textDecoration: 'none' }}>Browse other studies →</Link>
      </div>
    );
  }
  if (slotsLeft <= 0 && experimentStatus === 'recruiting') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ width: '100%', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', ...LABEL_STYLE, color: '#4a7055', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2 }}>Fully enrolled</div>
        <Link href="/experiments" style={{ ...LABEL_STYLE, fontSize: 10, color: '#4a7055', textDecoration: 'none' }}>Browse other studies →</Link>
      </div>
    );
  }
  if (deadlineClosed) {
    return (
      <div style={{ width: '100%', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', ...LABEL_STYLE, color: '#4a7055', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2 }}>Applications closed</div>
    );
  }
  if (experimentStatus === 'active') {
    return (
      <div style={{ width: '100%', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', ...LABEL_STYLE, color: '#8ee7ff', background: 'rgba(142,231,255,0.06)', border: '1px solid rgba(142,231,255,0.20)', borderRadius: 2 }}>Study in progress — applications closed</div>
    );
  }

  // Recruiting, not authenticated — login first then show protocol
  if (!authenticated) {
    return (
      <button
        onClick={() => login()}
        style={{ width: '100%', height: 48, cursor: 'pointer', ...LABEL_STYLE, fontWeight: 700, background: '#b7ff61', color: '#050709', border: 'none', borderRadius: 2 }}
      >
        Apply to this study →
      </button>
    );
  }

  // Recruiting, authenticated, no application — open protocol modal
  return (
    <>
      {showProtocol && <ProtocolModal {...modalProps} />}
      <button
        onClick={() => setShowProtocol(true)}
        style={{ width: '100%', height: 48, cursor: 'pointer', ...LABEL_STYLE, fontWeight: 700, background: '#b7ff61', color: '#050709', border: 'none', borderRadius: 2 }}
      >
        Apply to this study → ({slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} remaining)
      </button>
    </>
  );
}
