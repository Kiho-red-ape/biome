import Link from 'next/link';

// ─── Typography ───────────────────────────────────────────────────────────────

export function DocLabel({ text }: { text: string }) {
  return (
    <p style={{
      fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '2px',
      textTransform: 'uppercase', color: 'var(--teal)', fontWeight: 500,
      marginBottom: 10,
    }}>
      {text}
    </p>
  );
}

export function DocH1({ children }: { children: React.ReactNode }) {
  return (
    <h1 style={{
      fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700,
      color: 'var(--ink)', marginBottom: 10, lineHeight: 1.25,
      letterSpacing: '-0.02em',
    }}>
      {children}
    </h1>
  );
}

export function DocH2({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} style={{
      fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 650,
      color: 'var(--ink)', marginTop: 44, marginBottom: 12,
      paddingTop: 24, letterSpacing: '-0.01em',
      borderTop: '1px solid var(--border-soft)',
    }}>
      {children}
    </h2>
  );
}

export function DocH3({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontFamily: 'var(--font-display)', fontSize: 15.5, fontWeight: 600,
      color: 'var(--ink)', marginTop: 28, marginBottom: 8,
    }}>
      {children}
    </h3>
  );
}

export function DocP({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'var(--slate)',
      lineHeight: 1.8, marginBottom: 14,
    }}>
      {children}
    </p>
  );
}

export function DocLead({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: 'var(--font-body)', fontSize: 16.5, color: 'var(--slate)',
      lineHeight: 1.7, marginBottom: 28,
    }}>
      {children}
    </p>
  );
}

export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code style={{
      fontFamily: 'var(--font-mono)', fontSize: 12.5,
      color: 'var(--teal-dark)', background: 'var(--teal-faint)',
      border: '1px solid var(--border-soft)',
      padding: '1px 6px', borderRadius: 'var(--radius-xs, 6px)',
    }}>
      {children}
    </code>
  );
}

export function DocCodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre style={{
      fontFamily: 'var(--font-mono)', fontSize: 13,
      color: 'var(--teal-dark)', background: 'var(--teal-faint)',
      border: '1px solid var(--border-soft)',
      padding: '14px 18px', borderRadius: 'var(--radius-sm)',
      marginBottom: 14, overflowX: 'auto', whiteSpace: 'pre-wrap',
      lineHeight: 1.6,
    }}>
      {children}
    </pre>
  );
}

// ─── List ─────────────────────────────────────────────────────────────────────

export function DocUL({ items }: { items: string[] }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span aria-hidden style={{
            width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)',
            marginTop: 9, flexShrink: 0,
          }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'var(--slate)', lineHeight: 1.7 }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function DocOL({ items }: { items: React.ReactNode[] }) {
  return (
    <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, flexShrink: 0,
            color: 'var(--teal)', background: 'var(--teal-faint)',
            border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-xs, 6px)',
            minWidth: 24, height: 24, display: 'flex', alignItems: 'center',
            justifyContent: 'center', marginTop: 1,
          }}>
            {i + 1}
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'var(--slate)', lineHeight: 1.7 }}>{item}</span>
        </li>
      ))}
    </ol>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

export function DocTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{
      overflowX: 'auto', marginBottom: 20,
      borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-soft)',
      background: 'var(--surface)', boxShadow: 'var(--shadow-sm)',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--bg-page)', borderBottom: '1px solid var(--border-soft)' }}>
            {headers.map((h) => (
              <th key={h} style={{
                fontFamily: 'var(--font-body)', fontSize: 11.5, letterSpacing: '1px',
                textTransform: 'uppercase', color: 'var(--muted)',
                padding: '10px 16px', textAlign: 'left', fontWeight: 600,
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: ri < rows.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 13.5,
                  fontWeight: ci === 0 ? 550 : 400,
                  color: ci === 0 ? 'var(--ink)' : 'var(--slate)',
                  padding: '11px 16px', verticalAlign: 'top', lineHeight: 1.6,
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
      background: 'var(--teal-faint)',
      border: '1px solid var(--border-soft)',
      borderLeft: '3px solid var(--teal)',
      borderRadius: 'var(--radius-sm)',
    }}>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--slate)', lineHeight: 1.7, margin: 0 }}>
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
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'var(--slate)', marginLeft: 8, lineHeight: 1.7 }}>
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
      borderTop: '1px solid var(--border-soft)',
    }}>
      <div>
        {prev && (
          <Link href={prev.href} style={{ textDecoration: 'none' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 4, letterSpacing: '1px', textTransform: 'uppercase' }}>Previous</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 550, color: 'var(--teal-dark)' }}>← {prev.label}</p>
          </Link>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        {next && (
          <Link href={next.href} style={{ textDecoration: 'none' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 4, letterSpacing: '1px', textTransform: 'uppercase' }}>Next</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 550, color: 'var(--teal-dark)' }}>{next.label} →</p>
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Inline doc link ──────────────────────────────────────────────────────────

export function DocLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      color: 'var(--teal-dark)', fontWeight: 550, textDecoration: 'underline',
      textDecorationColor: 'rgba(14,116,144,0.3)', textUnderlineOffset: 3,
    }}>
      {children}
    </Link>
  );
}
