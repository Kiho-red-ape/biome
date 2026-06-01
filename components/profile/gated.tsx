'use client';

import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';

export function ProfileGated({ children }: { children: React.ReactNode }) {
  const { authenticated, login } = usePrivy();

  if (authenticated) return <>{children}</>;

  return (
    <div style={{
      border:      '3px solid var(--black)',
      boxShadow:   '4px 4px 0 var(--black)',
      background:  'var(--white)',
      padding:     '48px 24px',
      textAlign:   'center',
      margin:      '0 auto',
    }}>
      <div style={{
        fontFamily:    'var(--font-display)',
        fontSize:      11,
        fontWeight:    600,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color:         'var(--gray)',
        marginBottom:  16,
      }}>
        Private
      </div>
      <p style={{
        fontFamily:   'var(--font-display)',
        fontWeight:   700,
        fontSize:     18,
        color:        'var(--black)',
        marginBottom: 8,
        lineHeight:   1.2,
      }}>
        Sign in to view full profile
      </p>
      <p style={{
        fontFamily:   'var(--font-body)',
        fontSize:     13,
        color:        'var(--gray)',
        marginBottom: 28,
        lineHeight:   1.5,
      }}>
        Stats, study history, and earnings are visible to signed-in members.
      </p>
      <button onClick={login} className="btn-primary">
        Sign in →
      </button>
    </div>
  );
}
