'use client';

import { useState } from 'react';

interface Study { id: string; title: string; experiment_code: string | null; status: string }

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
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#aab8b1', lineHeight: 1.7, marginBottom: 24 }}>
        Generate a weekly sponsor report for a study. Includes enrollment status,
        compliance metrics, sample logistics, payout summary, and risks.
        Download as Markdown and send to the sponsor manually.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#5b8a9a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
            Select study
          </p>
          <select
            value={selectedStudy}
            onChange={(e) => setSelectedStudy(e.target.value)}
            style={{
              background: '#0b1014', border: '1px solid rgba(255,255,255,0.08)',
              color: '#f2faf4', fontFamily: 'var(--font-mono)', fontSize: 11,
              padding: '8px 12px', borderRadius: 2, outline: 'none', minWidth: 280, appearance: 'none',
            }}
          >
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
            fontFamily: 'var(--font-mono)', fontSize: 11, padding: '8px 20px',
            background: selectedStudy ? 'rgba(255,179,0,0.08)' : 'transparent',
            border: `1px solid ${selectedStudy ? 'rgba(255,179,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
            color: selectedStudy ? '#ffb300' : '#5b8a9a',
            cursor: selectedStudy ? 'pointer' : 'default',
            borderRadius: 2, textTransform: 'uppercase', letterSpacing: '1px',
          }}
        >
          {generating ? 'Generating…' : 'Generate report →'}
        </button>
      </div>

      {error && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ffb300', marginBottom: 16 }}>{error}</p>
      )}

      {report && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#b7ff61', textTransform: 'uppercase', letterSpacing: '1px' }}>
              ✓ Report generated
            </p>
            <button
              onClick={download}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, padding: '5px 12px',
                background: 'rgba(183,255,97,0.08)', border: '1px solid rgba(183,255,97,0.25)',
                color: '#b7ff61', cursor: 'pointer', borderRadius: 2,
                textTransform: 'uppercase', letterSpacing: '1px',
              }}
            >
              Download .md
            </button>
          </div>
          <pre style={{
            background:   '#0b1014',
            border:       '1px solid rgba(255,255,255,0.06)',
            padding:      '20px 24px',
            borderRadius: 2,
            fontFamily:   'var(--font-mono)',
            fontSize:     11,
            color:        '#aab8b1',
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
