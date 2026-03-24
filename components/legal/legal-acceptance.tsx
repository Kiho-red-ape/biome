'use client';

// LegalAcceptance — scroll-to-accept legal document modal/panel
// - Scroll progress indicator
// - Checkbox disabled until user scrolls to bottom
// - Accept/decline callbacks

import { useRef, useState, useEffect, useCallback } from 'react';
import type { LegalDocKey } from '@/lib/legal/documents';

interface Props {
  docKey:   LegalDocKey;
  title:    string;
  content:  string;
  onAccept: () => void;
  onDecline?: () => void;
  loading?: boolean;
}

export function LegalAcceptance({ docKey, title, content, onAccept, onDecline, loading = false }: Props) {
  const scrollRef  = useRef<HTMLDivElement>(null);
  const [progress, setProgress]  = useState(0);
  const [scrolled, setScrolled]  = useState(false);
  const [checked,  setChecked]   = useState(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const pct = scrollHeight <= clientHeight
      ? 100
      : Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
    setProgress(Math.min(100, pct));
    if (pct >= 98) setScrolled(true);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state (short content)
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const canAccept = scrolled && checked;

  return (
    <div
      className="flex flex-col rounded overflow-hidden"
      style={{
        background: 'var(--bg2)',
        border: '1px solid rgba(77,255,128,0.14)',
        boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
        maxWidth: 680,
        width: '100%',
        maxHeight: '90vh',
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(77,255,128,0.08)' }}
      >
        <div>
          <p className="mono text-xs mb-0.5" style={{ color: 'var(--text-dim)' }}>// LEGAL_DOCUMENT</p>
          <h2
            className="text-base font-black"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-white)' }}
          >
            {title}
          </h2>
        </div>
        {/* Progress pill */}
        <div
          className="mono text-xs px-2 py-1 rounded flex items-center gap-2 flex-shrink-0"
          style={{
            background: 'var(--bg3)',
            border: '1px solid rgba(77,255,128,0.1)',
            color: progress >= 98 ? 'var(--green)' : 'var(--text-dim)',
          }}
        >
          {progress >= 98 ? '✓ Read' : `Scroll to read (${progress}%)`}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 flex-shrink-0" style={{ background: 'rgba(77,255,128,0.08)' }}>
        <div
          className="h-0.5 transition-all duration-200"
          style={{ width: `${progress}%`, background: progress >= 98 ? 'var(--green)' : 'var(--green-dim)' }}
        />
      </div>

      {/* Scrollable document body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-4"
        style={{ minHeight: 0 }}
      >
        <pre
          className="text-xs leading-relaxed whitespace-pre-wrap"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-bright)',
            margin: 0,
          }}
        >
          {content}
        </pre>
      </div>

      {/* Footer — accept controls */}
      <div
        className="px-5 py-4 flex-shrink-0 flex flex-col gap-3"
        style={{ borderTop: '1px solid rgba(77,255,128,0.08)' }}
      >
        {/* Scroll hint */}
        {!scrolled && (
          <p className="mono text-xs" style={{ color: 'var(--amber)' }}>
            ↓ Scroll to the bottom to enable acceptance
          </p>
        )}

        {/* Translation note */}
        <div
          className="rounded p-2.5"
          style={{ background: 'rgba(183,255,97,0.03)', border: '1px solid rgba(183,255,97,0.08)' }}
        >
          <p className="mono text-xs leading-relaxed" style={{ color: 'var(--text-dim)', fontSize: 10 }}>
            ⚠ These terms are in English. If English is not your primary language, please translate and review the full text before accepting. By checking the box, you confirm you have understood the terms regardless of language.
          </p>
        </div>

        {/* Checkbox */}
        <label
          className="flex items-start gap-3 cursor-pointer select-none"
          style={{ opacity: scrolled ? 1 : 0.4 }}
        >
          <div
            onClick={() => { if (scrolled) setChecked((c) => !c); }}
            className="mt-0.5 flex-shrink-0 w-4 h-4 rounded transition-all flex items-center justify-center"
            style={{
              background: checked ? 'var(--green)' : 'transparent',
              border: `1px solid ${checked ? 'var(--green)' : 'rgba(77,255,128,0.3)'}`,
              cursor: scrolled ? 'pointer' : 'not-allowed',
            }}
          >
            {checked && <span style={{ color: '#050709', fontSize: 10, fontWeight: 900 }}>✓</span>}
          </div>
          <span className="mono text-xs leading-relaxed" style={{ color: 'var(--text-bright)' }}>
            I have read and agree to the {title}. I understand this is a legally binding agreement
            governed by the laws of India, with disputes resolved by binding arbitration.
          </span>
        </label>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onAccept}
            disabled={!canAccept || loading}
            className="flex-1 mono text-xs py-2.5 rounded font-bold transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: 'var(--green)', color: '#050709' }}
          >
            {loading ? 'SAVING…' : 'I ACCEPT →'}
          </button>
          {onDecline && (
            <button
              onClick={onDecline}
              disabled={loading}
              className="mono text-xs px-4 py-2.5 rounded transition-all hover:opacity-80"
              style={{ border: '1px solid rgba(77,255,128,0.12)', color: 'var(--text-dim)', background: 'transparent' }}
            >
              DECLINE
            </button>
          )}
        </div>

        <p className="mono text-xs text-center" style={{ color: 'var(--text-dim)', fontSize: 10 }}>
          doc: {docKey} · {new Date().toISOString().split('T')[0]}
        </p>
      </div>
    </div>
  );
}
