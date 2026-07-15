'use client';

import { useState } from 'react';

interface Study { id: string; title: string; experiment_code: string | null; status: string }

const SEL: React.CSSProperties = {
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
};

export function ReportGenerator({ studies }: { studies: Study[] }) {
  const [selectedStudy, setSelectedStudy] = useState('');
  const [generating,    setGenerating]    = useState(false);
  const [report,        setReport]        = useState<string | null>(null);
  const [error,         setError]         = useState<string | null>(null);

  async function generate() {
    if (!selectedStudy) return;
    setGenerating(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch(`/api/ops/experiments/report?id=${selectedStudy}`);
      if (!res.ok) throw new Error('Report generation failed');
      const data = await res.json() as { report: string };
      setReport(data.report);
    } catch {
      setError('Report generation failed. Try again.');
    } finally {
      setGenerating(false);
    }
  }

  function download() {
    if (!report) return;
    const blob = new Blob([report], { type: 'text/markdown' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    const study = studies.find((s) => s.id === selectedStudy);
    a.download = `biome-report-${study?.experiment_code ?? selectedStudy.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
            Select study
          </p>
          <select value={selectedStudy} onChange={(e) => setSelectedStudy(e.target.value)} style={SEL}>
            <option value="">— choose a study —</option>
            {studies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.experiment_code ? `${s.experiment_code} · ` : ''}{s.title.slice(0, 50)} [{s.status}]
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => void generate()}
          disabled={!selectedStudy || generating}
          style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      11,
            fontWeight:    600,
            letterSpacing: '0.5px',
            padding:       '8px 20px',
            background:    selectedStudy && !generating ? 'var(--teal)' : 'var(--surface)',
            border:        `1px solid ${selectedStudy && !generating ? 'var(--teal)' : 'var(--border-mid)'}`,
            color:         selectedStudy && !generating ? '#fff' : 'var(--muted)',
            cursor:        selectedStudy && !generating ? 'pointer' : 'default',
            borderRadius:  'var(--radius-sm)',
            opacity:       (!selectedStudy || generating) ? 0.6 : 1,
          }}
        >
          {generating ? 'Generating…' : 'Generate report →'}
        </button>
      </div>

      {error && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#b91c1c', marginBottom: 16 }}>{error}</p>
      )}

      {report && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#15803d', letterSpacing: '0.5px' }}>
              ✓ Report generated
            </p>
            <button
              onClick={download}
              style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      11,
                fontWeight:    600,
                letterSpacing: '0.5px',
                padding:       '6px 14px',
                background:    'var(--surface)',
                border:        '1px solid var(--border-mid)',
                color:         'var(--slate)',
                cursor:        'pointer',
                borderRadius:  'var(--radius-sm)',
              }}
            >
              Download .md
            </button>
          </div>
          <pre style={{
            background:   'var(--bg-page)',
            border:       '1px solid var(--border-soft)',
            padding:      '20px 24px',
            borderRadius: 'var(--radius)',
            fontFamily:   'var(--font-mono)',
            fontSize:     11,
            color:        'var(--slate)',
            lineHeight:   1.7,
            overflowX:    'auto',
            whiteSpace:   'pre-wrap',
            wordBreak:    'break-word',
          }}>
            {report}
          </pre>
        </div>
      )}
    </div>
  );
}
