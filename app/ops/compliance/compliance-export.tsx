'use client';

import { useState } from 'react';

export function ComplianceExport({
  studies,
}: {
  studies: { id: string; title: string; experiment_code: string | null }[];
}) {
  const [selectedStudy, setSelectedStudy] = useState('');
  const [exporting,     setExporting]     = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  async function handleExport() {
    if (!selectedStudy) return;
    setExporting(true);
    setError(null);
    try {
      const res = await fetch(`/api/ops/experiments/export?id=${selectedStudy}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `biome-compliance-${selectedStudy.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Export failed. Try again.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#aab8b1', lineHeight: 1.7, marginBottom: 24 }}>
        Generate a compliance pack for a study. Includes consent records,
        communication log, payout records, and sample chain-of-custody log.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#5b8a9a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
            Select study
          </p>
          <select
            value={selectedStudy}
            onChange={(e) => setSelectedStudy(e.target.value)}
            style={{
              background:   '#0b1014',
              border:       '1px solid rgba(255,255,255,0.08)',
              color:        '#f2faf4',
              fontFamily:   'var(--font-mono)',
              fontSize:     11,
              padding:      '8px 12px',
              borderRadius: 2,
              outline:      'none',
              minWidth:     280,
              appearance:   'none',
            }}
          >
            <option value="">— choose a study —</option>
            {studies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.experiment_code ? `${s.experiment_code} · ` : ''}{s.title.slice(0, 50)}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => void handleExport()}
          disabled={!selectedStudy || exporting}
          style={{
            fontFamily:   'var(--font-mono)',
            fontSize:     11,
            padding:      '8px 20px',
            background:   selectedStudy ? 'rgba(255,179,0,0.08)' : 'transparent',
            border:       `1px solid ${selectedStudy ? 'rgba(255,179,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
            color:        selectedStudy ? '#ffb300' : '#5b8a9a',
            cursor:       selectedStudy ? 'pointer' : 'default',
            borderRadius: 2,
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          {exporting ? 'Exporting…' : 'Download compliance pack →'}
        </button>
      </div>

      {error && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ffb300', marginTop: 12 }}>{error}</p>
      )}
    </div>
  );
}
