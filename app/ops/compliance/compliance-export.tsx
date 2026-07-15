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
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)', lineHeight: 1.7, marginBottom: 24 }}>
        Generate a compliance pack for a study. Includes consent records,
        communication log, payout records, and sample chain-of-custody log.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
            Select study
          </p>
          <select
            value={selectedStudy}
            onChange={(e) => setSelectedStudy(e.target.value)}
            style={{
              fontFamily:   'var(--font-mono)',
              fontSize:     12,
              color:        'var(--ink)',
              background:   'var(--bg-page)',
              border:       '1px solid var(--border-mid)',
              borderRadius: 'var(--radius-sm)',
              padding:      '8px 12px',
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
            fontFamily:    'var(--font-mono)',
            fontSize:      11,
            fontWeight:    600,
            letterSpacing: '0.5px',
            padding:       '8px 20px',
            background:    selectedStudy && !exporting ? 'var(--teal)' : 'var(--surface)',
            border:        `1px solid ${selectedStudy && !exporting ? 'var(--teal)' : 'var(--border-mid)'}`,
            color:         selectedStudy && !exporting ? '#fff' : 'var(--muted)',
            cursor:        selectedStudy && !exporting ? 'pointer' : 'default',
            borderRadius:  'var(--radius-sm)',
            opacity:       (!selectedStudy || exporting) ? 0.6 : 1,
          }}
        >
          {exporting ? 'Exporting…' : 'Download compliance pack →'}
        </button>
      </div>

      {error && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#b91c1c', marginTop: 12 }}>{error}</p>
      )}
    </div>
  );
}
