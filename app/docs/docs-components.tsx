import Link from 'next/link';

// ─── Typography ───────────────────────────────────────────────────────────────

export function DocLabel({ text }: { text: string }) {
  return (
    <p style={{
      fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px',
      textTransform: 'uppercase', color: 'var(--green)', marginBottom: 8,
    }}>
      // {text}
    </p>
  );
}

export function DocH1({ children }: { children: React.ReactNode }) {
  return (
    <h1 style={{
      fontFamily: 'var(--font-heading)', fontSize: 30, fontWeight: 800,
      color: 'var(--text-white)', marginBottom: 8, lineHeight: 1.2,
    }}>
      {children}
    </h1>
  );
}

export function DocH2({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} style={{
      fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700,
      color: 'var(--text-white)', marginTop: 44, marginBottom: 12,
      paddingTop: 4,
      borderTop: '1px solid rgba(77,255,128,0.07)',
    }}>
      {children}
    </h2>
  );
}

export function DocH3({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700,
      color: 'var(--text-bright)', marginTop: 28, marginBottom: 8,
    }}>
      {children}
    </h3>
  );
}

export function DocP({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: 'var(--font-heading)', fontSize: 14, color: '#94a3b8',
      lineHeight: 1.8, marginBottom: 14,
    }}>
      {children}
    </p>
  );
}

export function DocLead({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: 'var(--font-heading)', fontSize: 16, color: '#c0d4c4',
      lineHeight: 1.7, marginBottom: 28,
    }}>
      {children}
    </p>
  );
}

export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code style={{
      fontFamily: 'var(--font-mono)', fontSize: 11,
      color: 'var(--green)', background: 'rgba(77,255,128,0.07)',
      padding: '1px 5px', borderRadius: 2,
    }}>
      {children}
    </code>
  );
}

// ─── List ─────────────────────────────────────────────────────────────────────

export function DocUL({ items }: { items: string[] }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--green-dim)', marginTop: 3, flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: 10 }}>—</span>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function DocOL({ items }: { items: React.ReactNode[] }) {
  return (
    <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 8, counterReset: 'ol' }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, flexShrink: 0,
            color: 'var(--green)', minWidth: 18, marginTop: 2,
          }}>
            {i + 1}.
          </span>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>{item}</span>
        </li>
      ))}
    </ol>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

export function DocTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: 20, borderRadius: 3, border: '1px solid rgba(77,255,128,0.10)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--bg2)', borderBottom: '1px solid rgba(77,255,128,0.10)' }}>
            {headers.map((h) => (
              <th key={h} style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px',
                textTransform: 'uppercase', color: '#4a7055',
                padding: '10px 16px', textAlign: 'left', fontWeight: 400,
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: '1px solid rgba(77,255,128,0.05)', background: ri % 2 === 0 ? 'var(--bg)' : 'var(--bg2)' }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  fontFamily: ci === 0 ? 'var(--font-mono)' : 'var(--font-heading)',
                  fontSize: ci === 0 ? 11 : 13,
                  color: ci === 0 ? 'var(--text-bright)' : '#94a3b8',
                  padding: '10px 16px', verticalAlign: 'top', lineHeight: 1.6,
                }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Callout ──────────────────────────────────────────────────────────────────

export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      margin: '16px 0', padding: '14px 18px',
      background: 'rgba(77,255,128,0.04)',
      border: '1px solid rgba(77,255,128,0.12)',
      borderLeft: '3px solid var(--green)',
      borderRadius: 2,
    }}>
      <p style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: '#c0d4c4', lineHeight: 1.7, margin: 0 }}>
        {children}
      </p>
    </div>
  );
}

// ─── Term definition ──────────────────────────────────────────────────────────

export function Term({ term, def }: { term: string; def: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <Code>{term}</Code>
      <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: '#94a3b8', marginLeft: 8 }}>
        — {def}
      </span>
    </div>
  );
}

// ─── Prev / next navigation ───────────────────────────────────────────────────

export function DocNav({ prev, next }: {
  prev?: { label: string; href: string };
  next?: { label: string; href: string };
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', gap: 16,
      marginTop: 56, paddingTop: 24,
      borderTop: '1px solid rgba(77,255,128,0.08)',
    }}>
      <div>
        {prev && (
          <Link href={prev.href} style={{ textDecoration: 'none' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#4a7055', marginBottom: 4, letterSpacing: '1px' }}>PREVIOUS</p>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: 'var(--text-bright)' }}>← {prev.label}</p>
          </Link>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        {next && (
          <Link href={next.href} style={{ textDecoration: 'none' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#4a7055', marginBottom: 4, letterSpacing: '1px' }}>NEXT</p>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: 'var(--text-bright)' }}>{next.label} →</p>
          </Link>
        )}
      </div>
    </div>
  );
}
