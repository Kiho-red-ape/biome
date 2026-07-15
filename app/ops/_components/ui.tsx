'use client';

import Link from 'next/link';
import React from 'react';

// ── Shared ops UI kit — clinical design, dense for daily operator use ─────────

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)' };

// Page header: eyebrow label + title + optional subtitle + right-side actions.
export function OpsPageHeader({
  label, title, subtitle, actions,
}: {
  label: string;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      gap: 16, flexWrap: 'wrap', marginBottom: 24,
    }}>
      <div>
        <p style={{ ...MONO, fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--teal)', margin: '0 0 8px' }}>
          {label}
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--ink)', margin: 0, lineHeight: 1.15 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)', margin: '6px 0 0' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

// Card container.
export function OpsCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border-soft)',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  );
}

// Stat tiles row.
export function OpsStats({ items }: { items: { label: string; value: React.ReactNode; accent?: boolean }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(150px, 1fr))`, gap: 12, marginBottom: 24 }}>
      {items.map((m) => (
        <div key={m.label} style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-soft)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-sm)',
          padding: '14px 16px',
        }}>
          <div style={{ ...MONO, fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
            {m.label}
          </div>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, lineHeight: 1,
            color: m.accent ? 'var(--teal-dark)' : 'var(--ink)',
          }}>
            {m.value}
          </div>
        </div>
      ))}
    </div>
  );
}

type BadgeTone = 'teal' | 'green' | 'amber' | 'red' | 'slate' | 'blue';

const BADGE_TONES: Record<BadgeTone, React.CSSProperties> = {
  teal:  { background: 'var(--teal-soft)',          color: 'var(--teal-dark)',  border: '1px solid rgba(14,116,144,0.2)' },
  green: { background: 'rgba(22,163,74,0.08)',      color: '#15803d',           border: '1px solid rgba(22,163,74,0.25)' },
  amber: { background: 'rgba(217,119,6,0.08)',      color: '#b45309',           border: '1px solid rgba(217,119,6,0.25)' },
  red:   { background: 'rgba(220,38,38,0.06)',      color: '#b91c1c',           border: '1px solid rgba(220,38,38,0.2)' },
  slate: { background: 'var(--bg-page)',            color: 'var(--slate)',      border: '1px solid var(--border-mid)' },
  blue:  { background: 'rgba(2,132,199,0.08)',      color: '#0369a1',           border: '1px solid rgba(2,132,199,0.25)' },
};

export function OpsBadge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: BadgeTone }) {
  return (
    <span style={{
      ...MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase',
      padding: '3px 9px', borderRadius: 4, display: 'inline-block', whiteSpace: 'nowrap',
      ...BADGE_TONES[tone],
    }}>
      {children}
    </span>
  );
}

// Button — primary (teal) / ghost / danger.
export function OpsButton({
  children, onClick, variant = 'primary', disabled, type = 'button', href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit';
  href?: string;
}) {
  const base: React.CSSProperties = {
    ...MONO, fontSize: 11, fontWeight: 600, letterSpacing: '0.5px',
    padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: disabled ? 'default' : 'pointer',
    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
    transition: 'background 120ms, border-color 120ms, opacity 120ms',
    opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap',
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--teal)', color: '#fff', border: '1px solid var(--teal)' },
    ghost:   { background: 'var(--surface)', color: 'var(--slate)', border: '1px solid var(--border-mid)' },
    danger:  { background: 'transparent', color: '#b91c1c', border: '1px solid rgba(220,38,38,0.3)' },
  };
  const style = { ...base, ...variants[variant] };
  if (href) return <Link href={href} style={style}>{children}</Link>;
  return <button type={type} onClick={onClick} disabled={disabled} style={style}>{children}</button>;
}

// Filter tabs / pills.
export function OpsTabs<T extends string>({
  tabs, active, onChange,
}: {
  tabs: { key: T; label: string; count?: number }[];
  active: T;
  onChange: (k: T) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
      {tabs.map(({ key, label, count }) => {
        const on = active === key;
        return (
          <button key={key} onClick={() => onChange(key)} style={{
            ...MONO, fontSize: 11, fontWeight: 600, letterSpacing: '0.5px',
            padding: '6px 14px', cursor: 'pointer', borderRadius: 999,
            border: `1px solid ${on ? 'var(--teal)' : 'var(--border-mid)'}`,
            background: on ? 'var(--teal-soft)' : 'var(--surface)',
            color: on ? 'var(--teal-dark)' : 'var(--slate)',
            transition: 'all 120ms',
          }}>
            {label}{count !== undefined && <span style={{ opacity: 0.6, marginLeft: 6 }}>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

// Table primitives.
export function OpsTable({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <OpsCard>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-page)', borderBottom: '1px solid var(--border-soft)' }}>
              {head.map((h) => (
                <th key={h} style={{
                  textAlign: 'left', padding: '11px 14px', whiteSpace: 'nowrap',
                  ...MONO, fontSize: 9, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </OpsCard>
  );
}

export function OpsTd({ children, mono, dim, nowrap }: { children: React.ReactNode; mono?: boolean; dim?: boolean; nowrap?: boolean }) {
  return (
    <td style={{
      padding: '12px 14px',
      fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
      fontSize: mono ? 11 : 13,
      color: dim ? 'var(--muted)' : 'var(--ink)',
      whiteSpace: nowrap ? 'nowrap' : undefined,
      borderBottom: '1px solid var(--border-soft)',
    }}>
      {children}
    </td>
  );
}

export function OpsEmpty({ children }: { children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={99} style={{ padding: 40, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)' }}>
        {children}
      </td>
    </tr>
  );
}

export function OpsAlert({ tone, children }: { tone: 'ok' | 'err' | 'info'; children: React.ReactNode }) {
  const tones = {
    ok:   { background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.25)', color: '#15803d' },
    err:  { background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)',  color: '#b91c1c' },
    info: { background: 'var(--teal-faint)',    border: '1px solid var(--border-soft)',   color: 'var(--teal-dark)' },
  };
  return (
    <div style={{
      ...MONO, fontSize: 12, padding: '11px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 20,
      ...tones[tone],
    }}>
      {children}
    </div>
  );
}
