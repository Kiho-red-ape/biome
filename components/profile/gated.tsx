'use client';

import { usePrivy } from '@privy-io/react-auth';

export function ProfileGated({ children }: { children: React.ReactNode }) {
  const { authenticated, login } = usePrivy();

  if (authenticated) return <>{children}</>;

  return (
    <div style={{
      background:   'var(--surface)',
      border:       '1px solid var(--border-soft)',
      borderRadius: 'var(--radius)',
      boxShadow:    'var(--shadow-sm)',
      padding:      '48px 24px',
      textAlign:    'center',
      margin:       '0 auto',
    }}>
      <div style={{
        fontFamily:    'var(--font-display)',
        fontSize:      12,
        fontWeight:    600,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color:         'var(--teal)',
        marginBottom:  16,
      }}>
        Private
      </div>
      <p style={{
        fontFamily:   'var(--font-display)',
        fontWeight:   600,
        fontSize:     18,
        color:        'var(--ink)',
        marginBottom: 8,
        lineHeight:   1.2,
      }}>
        Sign in to view full profile
      </p>
      <p style={{
        fontFamily:   'var(--font-body)',
        fontSize:     14,
        color:        'var(--slate)',
        marginBottom: 28,
        lineHeight:   1.6,
      }}>
        Stats, study history, and compensation are visible to signed-in members.
      </p>
      <button onClick={login} className="btn-primary">
        Sign in →
      </button>
    </div>
  );
}
