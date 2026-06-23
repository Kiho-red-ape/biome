// Shared dashboard card shell — extracted from app/dashboard/page.tsx so the
// hub page and the new hub sections (needs-attention, inbox, documents) render
// one consistent clinical card.

export function DashCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background:   'var(--surface)',
      border:       '1px solid var(--border-soft)',
      borderRadius: 'var(--radius)',
      boxShadow:    'var(--shadow-sm)',
      marginBottom: 24,
      ...style,
    }}>
      {children}
    </div>
  );
}

export function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding:       '14px 24px',
      borderBottom:  '1px solid var(--border-soft)',
      fontFamily:    'var(--font-body)',
      fontSize:      11,
      fontWeight:    600,
      letterSpacing: '2px',
      textTransform: 'uppercase' as const,
      color:         'var(--slate)',
      background:    'var(--bg-page)',
      borderRadius:  'var(--radius) var(--radius) 0 0',
      display:       'flex',
      alignItems:    'center',
    }}>
      {children}
    </div>
  );
}
