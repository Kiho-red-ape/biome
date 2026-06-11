'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';

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
}

const LABEL_STYLE = {
  fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600,
  textTransform: 'uppercase' as const, letterSpacing: '1px',
};

export function ExperimentCTA({ experimentId, experimentStatus, slotsLeft, deadlineClosed }: Props) {
  const { authenticated, user, login, ready } = usePrivy();
  const [application, setApplication] = useState<ApplicationData | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user) {
      setApplication(null);
      return;
    }
    setLoading(true);
    fetch(`/api/experiments/${experimentId}/my-application?privyDid=${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then((json: { application: ApplicationData | null }) => setApplication(json.application))
      .catch(() => setApplication(null))
      .finally(() => setLoading(false));
  }, [ready, authenticated, user, experimentId]);

  // Not ready yet — show a neutral placeholder
  if (!ready || loading || application === undefined) {
    return (
      <div style={{
        width: '100%', height: 48,
        border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-sm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ ...LABEL_STYLE, color: 'var(--muted)' }}>—</span>
      </div>
    );
  }

  // ── User has an existing application ─────────────────────────────────────

  if (application) {
    const { status } = application;

    const dashboardLink = (
      <Link
        href="/dashboard"
        style={{ color: 'var(--teal)', textDecoration: 'none', ...LABEL_STYLE, fontSize: 12 }}
      >
        Go to dashboard →
      </Link>
    );

    if (status === 'applied') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            width: '100%', padding: '14px 20px',
            border: '1px solid rgba(180,83,9,0.2)', borderRadius: 'var(--radius-sm)',
            background: 'var(--warning-soft)',
          }}>
            <p style={{ ...LABEL_STYLE, color: 'var(--warning)', marginBottom: 6 }}>
              Application under review
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)' }}>
              Your application has been submitted. Track your status in your dashboard.
            </p>
          </div>
          {dashboardLink}
        </div>
      );
    }

    if (status === 'approved' || status === 'enrolled' || status === 'active') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            width: '100%', padding: '14px 20px',
            border: '1px solid rgba(21,128,61,0.2)', borderRadius: 'var(--radius-sm)',
            background: 'var(--success-soft)',
          }}>
            <p style={{ ...LABEL_STYLE, color: 'var(--success)', marginBottom: 6 }}>
              {status === 'approved' ? 'Accepted into this study' : 'Enrolled — study in progress'}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)' }}>
              Track milestones and progress in your dashboard.
            </p>
          </div>
          {dashboardLink}
        </div>
      );
    }

    if (status === 'waitlisted') {
      return (
        <div style={{
          width: '100%', padding: '14px 20px',
          border: '1px solid rgba(180,83,9,0.2)', borderRadius: 'var(--radius-sm)',
          background: 'var(--warning-soft)',
        }}>
          <p style={{ ...LABEL_STYLE, color: 'var(--warning)', marginBottom: 4 }}>You&apos;re on the waitlist</p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)' }}>
            We&apos;ll notify you if a spot opens.
          </p>
        </div>
      );
    }

    if (status === 'rejected') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            width: '100%', padding: '14px 20px',
            border: '1px solid rgba(185,28,28,0.2)', borderRadius: 'var(--radius-sm)',
            background: 'var(--error-soft)',
          }}>
            <p style={{ ...LABEL_STYLE, color: 'var(--error)', marginBottom: 4 }}>
              Application not selected
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)' }}>
              Your application was not selected for this study.
            </p>
          </div>
          <Link href="/experiments" style={{ color: 'var(--muted)', textDecoration: 'none', ...LABEL_STYLE, fontSize: 11 }}>
            Browse other studies →
          </Link>
        </div>
      );
    }

    if (status === 'completed') {
      return (
        <div style={{
          width: '100%', padding: '14px 20px',
          border: '1px solid rgba(21,128,61,0.2)', borderRadius: 'var(--radius-sm)',
          background: 'var(--success-soft)',
        }}>
          <p style={{ ...LABEL_STYLE, color: 'var(--success)', marginBottom: 4 }}>
            ✓ You completed this study
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)' }}>
            Check your earnings and compliance score in your{' '}
            <Link href="/dashboard" style={{ color: 'var(--teal)' }}>dashboard</Link>.
          </p>
        </div>
      );
    }
  }

  // ── No application — show standard CTA based on experiment state ──────────

  // Study completed, not enrolled
  if (experimentStatus === 'completed' || experimentStatus === 'cancelled') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{
          width: '100%', height: 48,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          ...LABEL_STYLE, color: 'var(--muted)',
          border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-sm)',
        }}>
          This study has been completed
        </div>
        <Link href="/experiments" style={{ ...LABEL_STYLE, fontSize: 11, color: 'var(--muted)', textDecoration: 'none' }}>
          Browse other studies →
        </Link>
      </div>
    );
  }

  // Slots full
  if (slotsLeft <= 0 && experimentStatus === 'recruiting') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{
          width: '100%', height: 48,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          ...LABEL_STYLE, color: 'var(--muted)',
          border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-sm)',
        }}>
          Fully enrolled
        </div>
        <Link href="/experiments" style={{ ...LABEL_STYLE, fontSize: 11, color: 'var(--muted)', textDecoration: 'none' }}>
          Browse other studies →
        </Link>
      </div>
    );
  }

  // Deadline closed
  if (deadlineClosed) {
    return (
      <div style={{
        width: '100%', height: 48,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...LABEL_STYLE, color: 'var(--muted)',
        border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-sm)',
      }}>
        Applications closed
      </div>
    );
  }

  // Active study — no applications open
  if (experimentStatus === 'active') {
    return (
      <div style={{
        width: '100%', height: 48,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...LABEL_STYLE, color: 'var(--success)', background: 'var(--success-soft)',
        border: '1px solid rgba(21,128,61,0.2)', borderRadius: 'var(--radius-sm)',
      }}>
        Study in progress — applications closed
      </div>
    );
  }

  // Recruiting, not authenticated
  if (!authenticated) {
    return (
      <button
        onClick={() => login()}
        style={{
          width: '100%', height: 48, cursor: 'pointer',
          ...LABEL_STYLE, fontWeight: 700,
          background: 'var(--teal)', color: '#ffffff',
          border: '1px solid var(--teal)', borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        Apply to this study →
      </button>
    );
  }

  // Recruiting, authenticated, no application yet
  return (
    <Link
      href={`/experiments/${experimentId}/apply`}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '100%', height: 48, textDecoration: 'none',
        ...LABEL_STYLE, fontWeight: 700,
        background: 'var(--teal)', color: '#ffffff', borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      Apply to this study → ({slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} remaining)
    </Link>
  );
}
