'use client';

// Your Health Record — the ongoing data-contribution hub.
// Three consent-gated sections: consent manager (the legal front door),
// metadata sync (longitudinal record), and health report uploads.
// Consumes GET/POST /api/data-hub and GET /api/data-hub/upload-url.

import { useCallback, useEffect, useState } from 'react';
import { DashCard, CardLabel } from './card';

// ─── Types ────────────────────────────────────────────────────────────────────

type ConsentScope = 'metadata_sync' | 'health_reports' | 'digital_twin_research';

type Snapshot = {
  id: string;
  source: string;
  captured_at: string;
  metrics: Record<string, number | string>;
};

type Report = {
  id: string;
  title: string;
  report_type: string;
  report_date: string | null;
  file_name: string | null;
  notes: string | null;
  created_at: string;
};

type HubData = {
  consentVersion: string;
  consentTexts: Record<string, { title: string; text: string }>;
  consents: Record<ConsentScope, boolean>;
  snapshots: Snapshot[];
  reports: Report[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SCOPES: ConsentScope[] = ['metadata_sync', 'health_reports', 'digital_twin_research'];

const SOURCES: Array<{ value: string; label: string }> = [
  { value: 'manual',       label: 'Manual entry'  },
  { value: 'apple_health', label: 'Apple Health'  },
  { value: 'google_fit',   label: 'Google Fit'    },
  { value: 'fitbit',       label: 'Fitbit'        },
  { value: 'garmin',       label: 'Garmin'        },
  { value: 'whoop',        label: 'Whoop'         },
  { value: 'oura',         label: 'Oura'          },
];

const SOURCE_LABEL: Record<string, string> = Object.fromEntries(SOURCES.map((s) => [s.value, s.label]));

const METRIC_FIELDS: Array<{ key: string; label: string; numeric: boolean }> = [
  { key: 'sleep_hours',     label: 'Sleep (hrs/night)',  numeric: true  },
  { key: 'steps_daily_avg', label: 'Steps (daily avg)',  numeric: true  },
  { key: 'resting_hr',      label: 'Resting HR (bpm)',   numeric: true  },
  { key: 'hrv_ms',          label: 'HRV (ms)',           numeric: true  },
  { key: 'weight_kg',       label: 'Weight (kg)',        numeric: true  },
  { key: 'notes',           label: 'Notes',              numeric: false },
];

const METRIC_SUMMARY: Array<{ key: string; short: string; unit: string }> = [
  { key: 'sleep_hours',     short: 'Sleep', unit: 'h'   },
  { key: 'steps_daily_avg', short: 'Steps', unit: ''    },
  { key: 'resting_hr',      short: 'RHR',   unit: 'bpm' },
  { key: 'hrv_ms',          short: 'HRV',   unit: 'ms'  },
  { key: 'weight_kg',       short: 'Wt',    unit: 'kg'  },
];

const REPORT_TYPES: Array<{ value: string; label: string }> = [
  { value: 'lab_panel',         label: 'Lab panel'         },
  { value: 'imaging',           label: 'Imaging'           },
  { value: 'genetic',           label: 'Genetic'           },
  { value: 'prescription',      label: 'Prescription'      },
  { value: 'discharge_summary', label: 'Discharge summary' },
  { value: 'vaccination',       label: 'Vaccination'       },
  { value: 'other',             label: 'Other'             },
];

const REPORT_TYPE_LABEL: Record<string, string> = Object.fromEntries(REPORT_TYPES.map((t) => [t.value, t.label]));

const CONSENT_NOTE = 'Consent required — agree to the matching permission above first.';

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  fontFamily:   'var(--font-body)',
  fontSize:     13,
  color:        'var(--ink)',
  background:   'var(--surface)',
  border:       '1px solid var(--border-mid)',
  borderRadius: 'var(--radius-sm)',
  padding:      '8px 10px',
  width:        '100%',
  boxSizing:    'border-box',
};

const fieldLabelStyle: React.CSSProperties = {
  fontFamily:   'var(--font-body)',
  fontSize:     11,
  fontWeight:   600,
  color:        'var(--slate)',
  marginBottom: 4,
  display:      'block',
};

const sectionHeadStyle: React.CSSProperties = {
  fontFamily:    'var(--font-mono)',
  fontSize:      10,
  fontWeight:    600,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color:         'var(--muted)',
  marginBottom:  12,
};

const primaryBtnStyle = (disabled: boolean): React.CSSProperties => ({
  fontFamily:   'var(--font-body)',
  fontSize:     13,
  fontWeight:   600,
  color:        '#ffffff',
  background:   'var(--teal)',
  border:       'none',
  borderRadius: 'var(--radius-sm)',
  padding:      '8px 16px',
  cursor:       disabled ? 'not-allowed' : 'pointer',
  opacity:      disabled ? 0.5 : 1,
});

const textBtnStyle = (color: string): React.CSSProperties => ({
  fontFamily: 'var(--font-body)',
  fontSize:   12,
  fontWeight: 600,
  color,
  background: 'none',
  border:     'none',
  padding:    0,
  cursor:     'pointer',
});

const mutedHintStyle: React.CSSProperties = {
  fontFamily:   'var(--font-body)',
  fontSize:     13,
  color:        'var(--muted)',
  background:   'var(--bg-page)',
  border:       '1px dashed var(--border-mid)',
  borderRadius: 'var(--radius-sm)',
  padding:      '14px 16px',
};

const errStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize:   12,
  color:      '#dc2626',
  marginTop:  8,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function postHub(body: Record<string, unknown>): Promise<{ ok: boolean; status: number; error: string | null }> {
  const res  = await fetch('/api/data-hub', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  return { ok: res.ok, status: res.status, error: json.error ?? null };
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function snapshotSummary(metrics: Record<string, number | string>): string {
  const parts: string[] = [];
  for (const m of METRIC_SUMMARY) {
    const v = metrics[m.key];
    if (v === undefined || v === null || v === '') continue;
    parts.push(`${m.short} ${v}${m.unit}`);
    if (parts.length === 3) break;
  }
  if (parts.length === 0 && typeof metrics.notes === 'string' && metrics.notes) {
    parts.push(metrics.notes.length > 40 ? `${metrics.notes.slice(0, 40)}...` : metrics.notes);
  }
  return parts.join(' · ') || '—';
}

// ─── Consent row ──────────────────────────────────────────────────────────────

function ConsentRowView(props: {
  title: string;
  text: string;
  active: boolean;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  confirming: boolean;
  setConfirming: (v: boolean) => void;
  busy: boolean;
  isLast: boolean;
  onGrant: () => void;
  onWithdraw: () => void;
}) {
  const { title, text, active, expanded, setExpanded, confirming, setConfirming, busy, isLast, onGrant, onWithdraw } = props;
  return (
    <div style={{
      padding:      '14px 0',
      borderBottom: isLast ? 'none' : '1px solid var(--border-soft)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
            {title}
          </div>
          <button onClick={() => setExpanded(!expanded)} style={{ ...textBtnStyle('var(--teal-dark)'), marginTop: 4 }}>
            {expanded ? 'Hide terms' : 'View terms'}
          </button>
          {expanded && (
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate)', lineHeight: 1.6, marginTop: 8, maxWidth: 560 }}>
              {text}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {active ? (
            <>
              <span style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      9,
                fontWeight:    700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                background:    'var(--teal-soft)',
                color:         'var(--teal-dark)',
                borderRadius:  4,
                padding:       '3px 8px',
              }}>
                ✓ Active
              </span>
              {confirming ? (
                <button onClick={onWithdraw} disabled={busy} style={textBtnStyle('#dc2626')}>
                  {busy ? '...' : 'Confirm withdraw?'}
                </button>
              ) : (
                <button onClick={() => setConfirming(true)} style={textBtnStyle('var(--muted)')}>
                  Withdraw
                </button>
              )}
            </>
          ) : (
            <button onClick={onGrant} disabled={busy} style={primaryBtnStyle(busy)}>
              {busy ? '...' : 'I agree'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ConsentManager({ privyDid, data, onChanged }: {
  privyDid: string;
  data: HubData;
  onChanged: () => Promise<void>;
}) {
  const [expanded,   setExpanded]   = useState<ConsentScope | null>(null);
  const [confirming, setConfirming] = useState<ConsentScope | null>(null);
  const [busy,       setBusy]       = useState<ConsentScope | null>(null);
  const [err,        setErr]        = useState<string | null>(null);

  async function change(scope: ConsentScope, action: 'grant_consent' | 'withdraw_consent') {
    setBusy(scope);
    setErr(null);
    try {
      const res = await postHub({ action, privyDid, scope });
      if (!res.ok) setErr(res.error ?? 'Something went wrong — please try again.');
      else await onChanged();
    } catch {
      setErr('Something went wrong — please try again.');
    } finally {
      setBusy(null);
      setConfirming(null);
    }
  }

  return (
    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-soft)' }}>
      <div style={sectionHeadStyle}>Data Permissions</div>
      <div>
        {SCOPES.map((scope, i) => {
          const meta = data.consentTexts[scope] ?? { title: scope, text: '' };
          return (
            <ConsentRowView
              key={scope}
              title={meta.title}
              text={meta.text}
              active={data.consents[scope]}
              expanded={expanded === scope}
              setExpanded={(v) => setExpanded(v ? scope : null)}
              confirming={confirming === scope}
              setConfirming={(v) => setConfirming(v ? scope : null)}
              busy={busy === scope}
              isLast={i === SCOPES.length - 1}
              onGrant={() => void change(scope, 'grant_consent')}
              onWithdraw={() => void change(scope, 'withdraw_consent')}
            />
          );
        })}
      </div>
      {err && <div style={errStyle}>{err}</div>}
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginTop: 12 }}>
        You choose what to share. Each permission is specific, withdrawable anytime, and your data stays
        linked to your pseudonymous ID — never your public identity.
      </div>
    </div>
  );
}

// ─── Metadata sync ────────────────────────────────────────────────────────────

function MetadataSync({ privyDid, enabled, snapshots, onChanged }: {
  privyDid: string;
  enabled: boolean;
  snapshots: Snapshot[];
  onChanged: () => Promise<void>;
}) {
  const [source, setSource] = useState('manual');
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy,   setBusy]   = useState(false);
  const [err,    setErr]    = useState<string | null>(null);

  async function submit() {
    const metrics: Record<string, number | string> = {};
    for (const f of METRIC_FIELDS) {
      const raw = (values[f.key] ?? '').trim();
      if (!raw) continue;
      if (f.numeric) {
        const n = Number(raw);
        if (!Number.isFinite(n)) {
          setErr(`"${f.label}" must be a number.`);
          return;
        }
        metrics[f.key] = n;
      } else {
        metrics[f.key] = raw;
      }
    }
    if (Object.keys(metrics).length === 0) {
      setErr('Fill in at least one metric before adding a snapshot.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await postHub({ action: 'sync_metadata', privyDid, source, metrics });
      if (!res.ok) {
        setErr(res.status === 403 ? CONSENT_NOTE : (res.error ?? 'Could not save snapshot — please try again.'));
        return;
      }
      setValues({});
      await onChanged();
    } catch {
      setErr('Could not save snapshot — please try again.');
    } finally {
      setBusy(false);
    }
  }

  const recent = snapshots.slice(0, 10);

  return (
    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-soft)' }}>
      <div style={sectionHeadStyle}>Metadata Sync — Longitudinal Record</div>

      {!enabled ? (
        <div style={mutedHintStyle}>Agree to metadata sync above to start your record.</div>
      ) : (
        <div>
          <div style={{ maxWidth: 260, marginBottom: 12 }}>
            <label style={fieldLabelStyle} htmlFor="dh-source">Source</label>
            <select id="dh-source" value={source} onChange={(e) => setSource(e.target.value)} style={inputStyle}>
              {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap:                 12,
            marginBottom:        14,
          }}>
            {METRIC_FIELDS.map((f) => (
              <div key={f.key}>
                <label style={fieldLabelStyle} htmlFor={`dh-m-${f.key}`}>{f.label}</label>
                <input
                  id={`dh-m-${f.key}`}
                  type="text"
                  inputMode={f.numeric ? 'decimal' : 'text'}
                  value={values[f.key] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
          <button onClick={() => void submit()} disabled={busy} style={primaryBtnStyle(busy)}>
            {busy ? 'Saving...' : 'Add snapshot →'}
          </button>
          {err && <div style={errStyle}>{err}</div>}
        </div>
      )}

      {/* Timeline */}
      {recent.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--slate)', marginBottom: 8 }}>
            {snapshots.length} {snapshots.length === 1 ? 'snapshot' : 'snapshots'} — your longitudinal record
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recent.map((s) => (
              <div key={s.id} style={{
                display:      'flex',
                alignItems:   'baseline',
                gap:          10,
                padding:      '8px 12px',
                background:   'var(--bg-page)',
                border:       '1px solid var(--border-soft)',
                borderRadius: 'var(--radius-sm)',
                flexWrap:     'wrap',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)', flexShrink: 0 }}>
                  {fmtDate(s.captured_at)}
                </span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>
                  {SOURCE_LABEL[s.source] ?? s.source}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', minWidth: 0 }}>
                  {snapshotSummary(s.metrics)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Health reports ───────────────────────────────────────────────────────────

type UploadPhase = 'idle' | 'uploading' | 'registering';

function ReportRow({ report, privyDid, onChanged, isLast }: {
  report: Report;
  privyDid: string;
  onChanged: () => Promise<void>;
  isLast: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy,       setBusy]       = useState(false);
  const [err,        setErr]        = useState(false);

  async function remove() {
    setBusy(true);
    setErr(false);
    try {
      const res = await postHub({ action: 'delete_report', privyDid, reportId: report.id });
      if (!res.ok) setErr(true);
      else await onChanged();
    } catch {
      setErr(true);
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      gap:            12,
      padding:        '10px 0',
      borderBottom:   isLast ? 'none' : '1px solid var(--border-soft)',
      flexWrap:       'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)' }}>
          {report.title}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
          {REPORT_TYPE_LABEL[report.report_type] ?? report.report_type}
          {report.report_date ? ` · ${fmtDate(report.report_date)}` : ''}
          {report.file_name ? ` · ${report.file_name}` : ''}
        </div>
        {err && <div style={errStyle}>Could not delete — please try again.</div>}
      </div>
      <div style={{ flexShrink: 0 }}>
        {confirming ? (
          <button onClick={() => void remove()} disabled={busy} style={textBtnStyle('#dc2626')}>
            {busy ? '...' : 'Confirm delete?'}
          </button>
        ) : (
          <button onClick={() => setConfirming(true)} style={textBtnStyle('var(--muted)')}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function HealthReports({ privyDid, enabled, reports, onChanged }: {
  privyDid: string;
  enabled: boolean;
  reports: Report[];
  onChanged: () => Promise<void>;
}) {
  const [file,       setFile]       = useState<File | null>(null);
  const [fileKey,    setFileKey]    = useState(0);
  const [title,      setTitle]      = useState('');
  const [reportType, setReportType] = useState('lab_panel');
  const [reportDate, setReportDate] = useState('');
  const [phase,      setPhase]      = useState<UploadPhase>('idle');
  const [err,        setErr]        = useState<string | null>(null);

  async function upload() {
    if (!file) { setErr('Choose a file to upload.'); return; }
    if (title.trim().length < 2) { setErr('Give the report a title (at least 2 characters).'); return; }
    setErr(null);
    setPhase('uploading');
    try {
      const urlRes  = await fetch(
        `/api/data-hub/upload-url?privyDid=${encodeURIComponent(privyDid)}&name=${encodeURIComponent(file.name)}`
      );
      const urlJson = (await urlRes.json().catch(() => ({}))) as { signedUrl?: string; filePath?: string; error?: string };
      if (!urlRes.ok || !urlJson.signedUrl || !urlJson.filePath) {
        setErr(urlRes.status === 403 ? CONSENT_NOTE : (urlJson.error ?? 'Could not prepare the upload.'));
        setPhase('idle');
        return;
      }

      const putRes = await fetch(urlJson.signedUrl, {
        method:  'PUT',
        headers: { 'Content-Type': file.type },
        body:    file,
      });
      if (!putRes.ok) {
        setErr('The file upload failed — please try again.');
        setPhase('idle');
        return;
      }

      setPhase('registering');
      const reg = await postHub({
        action:        'register_report',
        privyDid,
        title:         title.trim(),
        reportType,
        reportDate:    reportDate || undefined,
        filePath:      urlJson.filePath,
        fileName:      file.name,
        mimeType:      file.type || undefined,
        fileSizeBytes: file.size > 0 ? file.size : undefined,
      });
      if (!reg.ok) {
        setErr(reg.status === 403 ? CONSENT_NOTE : (reg.error ?? 'Could not save the report.'));
        setPhase('idle');
        return;
      }

      setFile(null);
      setFileKey((k) => k + 1);
      setTitle('');
      setReportType('lab_panel');
      setReportDate('');
      await onChanged();
    } catch {
      setErr('Something went wrong during the upload — please try again.');
    } finally {
      setPhase('idle');
    }
  }

  const busy = phase !== 'idle';

  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={sectionHeadStyle}>Health Reports</div>

      {!enabled ? (
        <div style={mutedHintStyle}>Agree to health report uploads above to add reports.</div>
      ) : (
        <div>
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap:                 12,
            marginBottom:        14,
          }}>
            <div>
              <label style={fieldLabelStyle} htmlFor="dh-r-file">File (PDF, JPG, PNG)</label>
              <input
                id="dh-r-file"
                key={fileKey}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                style={{ ...inputStyle, padding: '6px 8px' }}
              />
            </div>
            <div>
              <label style={fieldLabelStyle} htmlFor="dh-r-title">Title</label>
              <input
                id="dh-r-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Annual blood panel"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={fieldLabelStyle} htmlFor="dh-r-type">Type</label>
              <select id="dh-r-type" value={reportType} onChange={(e) => setReportType(e.target.value)} style={inputStyle}>
                {REPORT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={fieldLabelStyle} htmlFor="dh-r-date">Report date (optional)</label>
              <input
                id="dh-r-date"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
          <button onClick={() => void upload()} disabled={busy} style={primaryBtnStyle(busy)}>
            {phase === 'uploading' ? 'Uploading...' : phase === 'registering' ? 'Saving...' : 'Upload report →'}
          </button>
          {err && <div style={errStyle}>{err}</div>}
        </div>
      )}

      {/* Existing reports */}
      {reports.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--slate)', marginBottom: 4 }}>
            {reports.length} {reports.length === 1 ? 'report' : 'reports'} on file
          </div>
          <div>
            {reports.map((r, i) => (
              <ReportRow
                key={r.id}
                report={r}
                privyDid={privyDid}
                onChanged={onChanged}
                isLast={i === reports.length - 1}
              />
            ))}
          </div>
        </div>
      )}

      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginTop: 16 }}>
        Reports are stored encrypted and are visible only to you and BIOME operations. Nothing is shared
        with any study without your separate, explicit consent.
      </div>
    </div>
  );
}

// ─── Hub ──────────────────────────────────────────────────────────────────────

export function DataHub({ privyDid }: { privyDid: string }) {
  const [data,    setData]    = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const res  = await fetch(`/api/data-hub?privyDid=${encodeURIComponent(privyDid)}`);
      const json = (await res.json()) as HubData & { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to load your health record');
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load your health record');
    } finally {
      setLoading(false);
    }
  }, [privyDid]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return (
    <div id="data-hub" style={{ scrollMarginTop: 80 }}>
      <DashCard>
        <CardLabel>Your Health Record</CardLabel>

        {loading && (
          <div style={{ padding: '32px 24px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)' }}>
            Loading your health record...
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: '24px', fontFamily: 'var(--font-body)', fontSize: 13, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span>{error}</span>
            <button
              onClick={() => { setLoading(true); void refetch(); }}
              style={textBtnStyle('var(--teal-dark)')}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            <ConsentManager privyDid={privyDid} data={data} onChanged={refetch} />
            <MetadataSync
              privyDid={privyDid}
              enabled={data.consents.metadata_sync}
              snapshots={data.snapshots}
              onChanged={refetch}
            />
            <HealthReports
              privyDid={privyDid}
              enabled={data.consents.health_reports}
              reports={data.reports}
              onChanged={refetch}
            />
          </>
        )}
      </DashCard>
    </div>
  );
}
