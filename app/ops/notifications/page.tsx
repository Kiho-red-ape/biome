'use client';

import { useState, useEffect } from 'react';
import { OpsPageHeader, OpsCard, OpsAlert } from '../_components/ui';

type AudienceKind = 'all' | 'study' | 'country' | 'manual';

interface Study { id: string; title: string; status: string; }
interface HistoryItem { type: string; payload: { title: string; message: string }; created_at: string; }

const INPUT: React.CSSProperties = {
  fontFamily:   'var(--font-mono)',
  fontSize:     12,
  color:        'var(--ink)',
  background:   'var(--bg-page)',
  border:       '1px solid var(--border-mid)',
  borderRadius: 'var(--radius-sm)',
  padding:      '9px 12px',
  width:        '100%',
  outline:      'none',
  boxSizing:    'border-box',
};

const LABEL: React.CSSProperties = {
  fontFamily:    'var(--font-mono)',
  fontSize:      9,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  color:         'var(--muted)',
  display:       'block',
  marginBottom:  6,
};

const NOTIF_TYPES = ['info', 'study_match', 'newsletter', 'alert', 'milestone_verified'];
const COUNTRIES   = ['India','United States','United Kingdom','EU','Australia','Singapore','Canada','Germany','France','Brazil','Japan','Other'];

export default function OpsNotificationsPage() {
  const [notifType, setNotifType] = useState('info');
  const [title,     setTitle]     = useState('');
  const [message,   setMessage]   = useState('');
  const [audience,  setAudience]  = useState<AudienceKind>('all');
  const [studyId,   setStudyId]   = useState('');
  const [country,   setCountry]   = useState('');
  const [manualIds, setManualIds] = useState('');
  const [sending,   setSending]   = useState(false);
  const [result,    setResult]    = useState<{ ok?: boolean; count?: number; error?: string } | null>(null);
  const [studies,   setStudies]   = useState<Study[]>([]);
  const [history,   setHistory]   = useState<HistoryItem[]>([]);

  useEffect(() => {
    fetch('/api/experiments?status=recruiting&status=active')
      .then(r => r.json())
      .then((d: { experiments?: Study[] }) => setStudies(d.experiments ?? []))
      .catch(() => {});
    fetch('/api/ops/notifications')
      .then(r => r.json())
      .then((d: { notifications?: HistoryItem[] }) => setHistory(d.notifications ?? []))
      .catch(() => {});
  }, []);

  async function send() {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    setResult(null);

    let audiencePayload: Record<string, unknown>;
    if (audience === 'all')     audiencePayload = { kind: 'all' };
    else if (audience === 'study')   audiencePayload = { kind: 'study', study_id: studyId };
    else if (audience === 'country') audiencePayload = { kind: 'country', country };
    else audiencePayload = { kind: 'manual', participant_ids: manualIds.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) };

    try {
      const res = await fetch('/api/ops/notifications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifType, title: title.trim(), message: message.trim(), audience: audiencePayload }),
      });
      const data = await res.json() as { ok?: boolean; count?: number; error?: string };
      setResult(data);
      if (data.ok) {
        setTitle(''); setMessage('');
        fetch('/api/ops/notifications')
          .then(r => r.json())
          .then((d: { notifications?: HistoryItem[] }) => setHistory(d.notifications ?? []))
          .catch(() => {});
      }
    } catch {
      setResult({ error: 'Network error' });
    }
    setSending(false);
  }

  function PillGroup<T extends string>({
    options, active, onChange, labelFn,
  }: { options: T[]; active: T; onChange: (v: T) => void; labelFn?: (v: T) => string }) {
    return (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.map(o => {
          const on = active === o;
          return (
            <button key={o} type="button" onClick={() => onChange(o)} style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      10,
              fontWeight:    600,
              letterSpacing: '0.5px',
              padding:       '5px 12px',
              borderRadius:  999,
              border:        `1px solid ${on ? 'var(--teal)' : 'var(--border-mid)'}`,
              background:    on ? 'var(--teal-soft)' : 'var(--surface)',
              color:         on ? 'var(--teal-dark)' : 'var(--slate)',
              cursor:        'pointer',
              transition:    'all 100ms',
            }}>
              {labelFn ? labelFn(o) : o}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <OpsPageHeader
        label="Notifications"
        title="Send Notification"
        subtitle="Send in-app notifications to participants. Study match notifications go to participants not yet enrolled in that study."
      />

      <OpsCard style={{ padding: '24px 28px', marginBottom: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div>
            <span style={LABEL}>Notification type</span>
            <PillGroup options={NOTIF_TYPES} active={notifType} onChange={setNotifType} />
          </div>

          <div>
            <label style={LABEL}>Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={INPUT}
              placeholder="e.g. New study available matching your profile" maxLength={200} />
          </div>

          <div>
            <label style={LABEL}>Message *</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
              style={{ ...INPUT, resize: 'vertical', lineHeight: 1.7 }}
              placeholder="Write the full notification message here. Keep it concise and actionable." maxLength={2000} />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
              {message.length}/2000
            </p>
          </div>

          <div>
            <span style={LABEL}>Audience</span>
            <div style={{ marginBottom: 14 }}>
              <PillGroup<AudienceKind>
                options={['all', 'study', 'country', 'manual']}
                active={audience}
                onChange={setAudience}
                labelFn={a => a === 'all' ? 'All Participants' : a === 'study' ? 'Study Match' : a === 'country' ? 'By Country' : 'Manual IDs'}
              />
            </div>

            {audience === 'study' && (
              <div>
                <label style={LABEL}>Study</label>
                <select value={studyId} onChange={e => setStudyId(e.target.value)}
                  style={{ ...INPUT, appearance: 'none' }}>
                  <option value="">Select a study</option>
                  {studies.map(s => (
                    <option key={s.id} value={s.id}>{s.title} ({s.status})</option>
                  ))}
                </select>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>
                  Will notify all participants who have not yet applied to this study.
                </p>
              </div>
            )}

            {audience === 'country' && (
              <div>
                <label style={LABEL}>Country</label>
                <select value={country} onChange={e => setCountry(e.target.value)}
                  style={{ ...INPUT, appearance: 'none' }}>
                  <option value="">Select country</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            {audience === 'manual' && (
              <div>
                <label style={LABEL}>Participant IDs (P-XXXX-XXXX, one per line or comma-separated)</label>
                <textarea value={manualIds} onChange={e => setManualIds(e.target.value)} rows={4}
                  style={{ ...INPUT, resize: 'vertical', lineHeight: 1.6 }}
                  placeholder={'P-1234-ABCD\nP-5678-EFGH'} />
              </div>
            )}
          </div>

          {result && (
            <OpsAlert tone={result.ok ? 'ok' : 'err'}>
              {result.ok
                ? `✓ Sent to ${result.count} participant${result.count !== 1 ? 's' : ''}`
                : `✗ ${result.error}`}
            </OpsAlert>
          )}

          <div>
            <button type="button" onClick={() => void send()}
              disabled={sending || !title.trim() || !message.trim()}
              style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      11,
                fontWeight:    600,
                letterSpacing: '0.5px',
                padding:       '10px 28px',
                borderRadius:  'var(--radius-sm)',
                cursor:        sending || !title.trim() || !message.trim() ? 'default' : 'pointer',
                background:    'var(--teal)',
                border:        '1px solid var(--teal)',
                color:         '#fff',
                opacity:       (sending || !title.trim() || !message.trim()) ? 0.5 : 1,
              }}>
              {sending ? 'Sending…' : 'Send notification →'}
            </button>
          </div>
        </div>
      </OpsCard>

      {history.length > 0 && (
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 16 }}>
            Recent sent
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.slice(0, 20).map((item, i) => (
              <OpsCard key={i} style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                  <span style={{
                    fontFamily:    'var(--font-mono)',
                    fontSize:      9,
                    fontWeight:    700,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    color:         'var(--teal-dark)',
                    background:    'var(--teal-soft)',
                    border:        '1px solid rgba(14,116,144,0.2)',
                    padding:       '2px 8px',
                    borderRadius:  4,
                  }}>
                    {item.type}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--ink)', margin: '0 0 2px' }}>
                  {item.payload?.title}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate)', margin: 0 }}>
                  {item.payload?.message?.slice(0, 120)}{(item.payload?.message?.length ?? 0) > 120 ? '…' : ''}
                </p>
              </OpsCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
