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
  fontFamily: 'var(--font-mono)', fontSize: 11,
  textTransform: 'uppercase' as const, letterSpacing: '2px',
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
        border: '1px solid rgba(77,255,128,0.06)', borderRadius: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ ...LABEL_STYLE, color: '#4a7055' }}>—</span>
      </div>
    );
  }

  // ── User has an existing application ─────────────────────────────────────

  if (application) {
    const { status } = application;

    const dashboardLink = (
      <Link
        href="/dashboard"
        style={{ color: 'var(--green)', textDecoration: 'none', ...LABEL_STYLE, fontSize: 12 }}
      >
        Go to dashboard →
      </Link>
    );

    if (status === 'applied') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            width: '100%', padding: '14px 20px',
            border: '1px solid rgba(255,179,0,0.2)', borderRadius: 2,
            background: 'rgba(255,179,0,0.04)',
          }}>
            <p style={{ ...LABEL_STYLE, color: 'var(--amber)', marginBottom: 6 }}>
              Application under review
            </p>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: '#94a3b8' }}>
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
            border: '1px solid rgba(0,229,255,0.2)', borderRadius: 2,
            background: 'rgba(0,229,255,0.04)',
          }}>
            <p style={{ ...LABEL_STYLE, color: 'var(--cyan)', marginBottom: 6 }}>
              {status === 'approved' ? 'Accepted into this study' : 'Enrolled — study in progress'}
            </p>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: '#94a3b8' }}>
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
          border: '1px solid rgba(160,92,16,0.25)', borderRadius: 2,
          background: 'rgba(160,92,16,0.04)',
        }}>
          <p style={{ ...LABEL_STYLE, color: '#a05c10', marginBottom: 4 }}>You&apos;re on the waitlist</p>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: '#94a3b8' }}>
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
            border: '1px solid rgba(180,60,60,0.2)', borderRadius: 2,
            background: 'rgba(180,60,60,0.04)',
          }}>
            <p style={{ ...LABEL_STYLE, color: '#7a3535', marginBottom: 4 }}>
              Application not selected
            </p>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: '#94a3b8' }}>
              Your application was not selected for this study.
            </p>
          </div>
          <Link href="/experiments" style={{ color: '#4a7055', textDecoration: 'none', ...LABEL_STYLE, fontSize: 11 }}>
            Browse other studies →
          </Link>
        </div>
      );
    }

    if (status === 'completed') {
      return (
        <div style={{
          width: '100%', padding: '14px 20px',
          border: '1px solid rgba(77,255,128,0.15)', borderRadius: 2,
          background: 'rgba(77,255,128,0.04)',
        }}>
          <p style={{ ...LABEL_STYLE, color: 'var(--green)', marginBottom: 4 }}>
            ✓ You completed this study
          </p>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: '#94a3b8' }}>
            Check your earnings and compliance score in your{' '}
            <Link href="/dashboard" style={{ color: 'var(--green)' }}>dashboard</Link>.
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
          ...LABEL_STYLE, color: '#4a7055',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2,
        }}>
          This study has been completed
        </div>
        <Link href="/experiments" style={{ ...LABEL_STYLE, fontSize: 10, color: '#4a7055', textDecoration: 'none' }}>
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
          ...LABEL_STYLE, color: '#4a7055',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2,
        }}>
          Fully enrolled
        </div>
        <Link href="/experiments" style={{ ...LABEL_STYLE, fontSize: 10, color: '#4a7055', textDecoration: 'none' }}>
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
        ...LABEL_STYLE, color: '#4a7055',
        border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2,
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
        ...LABEL_STYLE, color: '#8ee7ff', background: 'rgba(142,231,255,0.06)',
        border: '1px solid rgba(142,231,255,0.20)', borderRadius: 2,
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
          background: '#f59e0b', color: '#060a14',
          border: 'none', borderRadius: 2,
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
        background: '#f59e0b', color: '#060a14', borderRadius: 2,
      }}
    >
      Apply to this study → ({slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} remaining)
    </Link>
  );
}
