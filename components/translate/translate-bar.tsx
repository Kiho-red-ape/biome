'use client';

import { useState } from 'react';

// Language bar for participant-facing content: English (original) plus Tamil,
// Hindi, and German via the cached /api/translate endpoint. The caller renders
// the original when `active === 'en'`, and `translated` otherwise.

export type TransLang = 'en' | 'ta' | 'hi' | 'de';

const LANGS: { key: TransLang; label: string }[] = [
  { key: 'en', label: 'English' },
  { key: 'ta', label: 'தமிழ்' },
  { key: 'hi', label: 'हिन्दी' },
  { key: 'de', label: 'Deutsch' },
];

export function useTranslation(sourceText: string, kind: 'icf' | 'lesson' | 'study' | 'generic' = 'generic') {
  const [active,     setActive]     = useState<TransLang>('en');
  const [translated, setTranslated] = useState<string | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(false);
  const [cache] = useState<Map<string, string>>(() => new Map());

  async function select(lang: TransLang) {
    setError(false);
    if (lang === 'en') { setActive('en'); setTranslated(null); return; }
    const hit = cache.get(lang);
    if (hit) { setActive(lang); setTranslated(hit); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/translate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text: sourceText, lang, kind }),
      });
      const data = (await res.json()) as { translated?: string };
      if (!res.ok || !data.translated) { setError(true); return; }
      cache.set(lang, data.translated);
      setActive(lang);
      setTranslated(data.translated);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return { active, translated, loading, error, select };
}

export function TranslateBar({
  active, loading, error, onSelect, showFidelityNote,
}: {
  active: TransLang;
  loading: boolean;
  error: boolean;
  onSelect: (l: TransLang) => void;
  showFidelityNote?: boolean;
}) {
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)', marginRight: 4 }}>
          Language
        </span>
        {LANGS.map((l) => {
          const on = active === l.key;
          return (
            <button
              key={l.key}
              onClick={() => onSelect(l.key)}
              disabled={loading}
              style={{
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                padding: '5px 12px', borderRadius: 999, cursor: loading ? 'default' : 'pointer',
                background: on ? 'var(--teal)' : 'var(--surface)',
                border: `1px solid ${on ? 'var(--teal)' : 'var(--border-mid)'}`,
                color: on ? '#ffffff' : 'var(--slate)',
                opacity: loading && !on ? 0.6 : 1,
              }}
            >
              {l.label}
            </button>
          );
        })}
        {loading && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>Translating…</span>
        )}
        {error && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#b91c1c' }}>Translation unavailable — try again</span>
        )}
      </div>
      {showFidelityNote && active !== 'en' && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--muted)', margin: '8px 0 0', lineHeight: 1.5 }}>
          This translation is provided to aid understanding. The English original remains the
          authoritative version — what you agree to is the English document.
        </p>
      )}
    </div>
  );
}
