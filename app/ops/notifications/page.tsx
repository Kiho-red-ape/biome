'use client';

import { useState, useEffect } from 'react';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)' };

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 12, color: '#f2faf4',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 2, padding: '10px 14px', width: '100%', outline: 'none', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5b8a9a',
  letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: 6,
};

type AudienceKind = 'all' | 'study' | 'country' | 'manual';

interface Study { id: string; title: string; status: string; }
interface HistoryItem { type: string; payload: { title: string; message: string }; created_at: string; }

export default function OpsNotificationsPage() {
  const [notifType, setNotifType]   = useState('info');
  const [title,     setTitle]       = useState('');
  const [message,   setMessage]     = useState('');
  const [audience,  setAudience]    = useState<AudienceKind>('all');
  const [studyId,   setStudyId]     = useState('');
  const [country,   setCountry]     = useState('');
  const [manualIds, setManualIds]   = useState('');
  const [sending,   setSending]     = useState(false);
  const [result,    setResult]      = useState<{ ok?: boolean; count?: number; error?: string } | null>(null);
  const [studies,   setStudies]     = useState<Study[]>([]);
  const [history,   setHistory]     = useState<HistoryItem[]>([]);

  useEffect(() => {
    // Load recruiting studies
    fetch('/api/experiments?status=recruiting&status=active')
      .then(r => r.json())
      .then((d: { experiments?: Study[] }) => setStudies(d.experiments ?? []))
      .catch(() => {});
    // Load notification history
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
        // Refresh history
        fetch('/api/ops/notifications').then(r => r.json()).then((d: { notifications?: HistoryItem[] }) => setHistory(d.notifications ?? [])).catch(() => {});
      }
    } catch {
      setResult({ error: 'Network error' });
    }
    setSending(false);
  }

  const NOTIF_TYPES = ['info', 'study_match', 'newsletter', 'alert', 'milestone_verified'];

  const COUNTRIES = ['India','United States','United Kingdom','EU','Australia','Singapore','Canada','Germany','France','Brazil','Japan','Other'];

  return (
    <div style={{ maxWidth: 760 }}>
      <p style={{ ...MONO, fontSize: 10, letterSpacing: '3px', color: '#ffb300', textTransform: 'uppercase', marginBottom: 8 }}>
        // NOTIFICATIONS
      </p>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 22, color: '#f2faf4', marginBottom: 4 }}>
        Send Notification
      </h1>
      <p style={{ ...MONO, fontSize: 12, color: '#5b8a9a', lineHeight: 1.7, marginBottom: 32 }}>
        Send in-app notifications to participants. Study match notifications go to participants not yet enrolled in that study.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Type */}
        <div>
          <span style={labelStyle}>Notification Type</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {NOTIF_TYPES.map(t => (
              <button key={t} type="button" onClick={() => setNotifType(t)} style={{
                ...MONO, fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase',
                padding: '5px 12px', borderRadius: 2, cursor: 'pointer',
                border: `1px solid ${notifType === t ? '#ffb300' : 'rgba(255,255,255,0.08)'}`,
                background: notifType === t ? 'rgba(255,179,0,0.08)' : 'transparent',
                color: notifType === t ? '#ffb300' : '#5b8a9a',
              }}>{t}</button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label style={labelStyle}>Title *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="e.g. New study available matching your profile" maxLength={200} />
        </div>

        {/* Message */}
        <div>
          <label style={labelStyle}>Message *</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
            placeholder="Write the full notification message here. Keep it concise and actionable." maxLength={2000} />
          <p style={{ ...MONO, fontSize: 10, color: '#3a4a43', marginTop: 4 }}>{message.length}/2000</p>
        </div>

        {/* Audience */}
        <div>
          <span style={labelStyle}>Audience</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {(['all','study','country','manual'] as AudienceKind[]).map(a => (
              <button key={a} type="button" onClick={() => setAudience(a)} style={{
                ...MONO, fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase',
                padding: '5px 12px', borderRadius: 2, cursor: 'pointer',
                border: `1px solid ${audience === a ? '#b7ff61' : 'rgba(255,255,255,0.08)'}`,
                background: audience === a ? 'rgba(183,255,97,0.06)' : 'transparent',
                color: audience === a ? '#b7ff61' : '#5b8a9a',
              }}>
                {a === 'all' ? 'All Participants' : a === 'study' ? 'Study Match' : a === 'country' ? 'By Country' : 'Manual IDs'}
              </button>
            ))}
          </div>

          {audience === 'study' && (
            <div>
              <label style={labelStyle}>Study</label>
              <select value={studyId} onChange={e => setStudyId(e.target.value)}
                style={{ ...inputStyle, appearance: 'none' }}>
                <option value="">Select a study</option>
                {studies.map(s => (
                  <option key={s.id} value={s.id}>{s.title} ({s.status})</option>
                ))}
              </select>
              <p style={{ ...MONO, fontSize: 10, color: '#5b8a9a', marginTop: 6, lineHeight: 1.5 }}>
                Will notify all participants who have not yet applied to this study.
              </p>
            </div>
          )}

          {audience === 'country' && (
            <div>
              <label style={labelStyle}>Country</label>
              <select value={country} onChange={e => setCountry(e.target.value)}
                style={{ ...inputStyle, appearance: 'none' }}>
                <option value="">Select country</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {audience === 'manual' && (
            <div>
              <label style={labelStyle}>Participant IDs (P-XXXX-XXXX, one per line or comma-separated)</label>
              <textarea value={manualIds} onChange={e => setManualIds(e.target.value)} rows={4}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                placeholder={'P-1234-ABCD\nP-5678-EFGH'} />
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div style={{
            padding: '12px 16px', borderRadius: 2,
            background: result.ok ? 'rgba(183,255,97,0.05)' : 'rgba(255,100,100,0.05)',
            border: `1px solid ${result.ok ? 'rgba(183,255,97,0.2)' : 'rgba(255,100,100,0.2)'}`,
          }}>
            <p style={{ ...MONO, fontSize: 12, color: result.ok ? '#b7ff61' : '#ff6464', margin: 0 }}>
              {result.ok ? `✓ Sent to ${result.count} participant${result.count !== 1 ? 's' : ''}` : `✗ ${result.error}`}
            </p>
          </div>
        )}

        {/* Send button */}
        <div>
          <button type="button" onClick={send} disabled={sending || !title.trim() || !message.trim()}
            style={{
              ...MONO, fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase',
              padding: '10px 28px', borderRadius: 2, cursor: sending ? 'not-allowed' : 'pointer',
              background: 'rgba(183,255,97,0.08)', border: '1px solid rgba(183,255,97,0.3)',
              color: '#b7ff61', opacity: (sending || !title.trim() || !message.trim()) ? 0.4 : 1,
            }}>
            {sending ? 'Sending…' : 'Send notification →'}
          </button>
        </div>

      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={{ marginTop: 56, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 32 }}>
          <p style={{ ...MONO, fontSize: 10, letterSpacing: '3px', color: '#ffb300', textTransform: 'uppercase', marginBottom: 16 }}>
            // RECENT_SENT
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.slice(0, 20).map((item, i) => (
              <div key={i} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ ...MONO, fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: '#ffb300', border: '1px solid rgba(255,179,0,0.2)', padding: '1px 6px', borderRadius: 2 }}>{item.type}</span>
                  <span style={{ ...MONO, fontSize: 10, color: '#5b8a9a' }}>{new Date(item.created_at).toLocaleString()}</span>
                </div>
                <p style={{ ...MONO, fontSize: 12, color: '#f2faf4', margin: '0 0 2px' }}>{item.payload?.title}</p>
                <p style={{ ...MONO, fontSize: 11, color: '#5b8a9a', margin: 0 }}>{item.payload?.message?.slice(0, 120)}{(item.payload?.message?.length ?? 0) > 120 ? '…' : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
