'use client';

import { useState, useEffect, useCallback } from 'react';

interface SentMessage {
  id: string;
  subject: string;
  body: string;
  handoff_url: string | null;
  sent_at: string;
  recipient_count: number;
}

interface Props {
  experimentId: string;
  privyDid: string;
  recipientCount: number;
}

function relDate(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function MessageComposer({ experimentId, privyDid, recipientCount }: Props) {
  const [subject,    setSubject]    = useState('');
  const [body,       setBody]       = useState('');
  const [handoffUrl, setHandoffUrl] = useState('');
  const [sending,    setSending]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [success,    setSuccess]    = useState<string | null>(null);
  const [history,    setHistory]    = useState<SentMessage[]>([]);
  const [loadingHist, setLoadingHist] = useState(true);
  const [expanded,   setExpanded]   = useState(false);

  const loadHistory = useCallback(async () => {
    setLoadingHist(true);
    try {
      const res  = await fetch(`/api/study-messages?experiment_id=${experimentId}&privyDid=${encodeURIComponent(privyDid)}`);
      const data = await res.json() as { messages?: SentMessage[] };
      setHistory(data.messages ?? []);
    } catch { /* ignore */ } finally {
      setLoadingHist(false);
    }
  }, [experimentId, privyDid]);

  useEffect(() => { void loadHistory(); }, [loadHistory]);

  const urlValid = handoffUrl === '' || handoffUrl.startsWith('https://');

  async function handleSend() {
    if (!subject.trim() || !body.trim()) { setError('Subject and body are required'); return; }
    if (!urlValid) { setError('Handoff URL must start with https://'); return; }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const res  = await fetch('/api/study-messages', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ privyDid, experiment_id: experimentId, subject: subject.trim(), body: body.trim(), handoff_url: handoffUrl.trim() }),
      });
      const data = await res.json() as { recipient_count?: number; error?: string };

      if (!res.ok) {
        setError(data.error ?? 'Failed to send');
        return;
      }

      setSuccess(`✓ Message sent to ${data.recipient_count} participant${(data.recipient_count ?? 0) !== 1 ? 's' : ''}`);
      setSubject('');
      setBody('');
      setHandoffUrl('');
      setExpanded(false);
      void loadHistory();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded overflow-hidden" style={{ border: '1px solid rgba(0,229,255,0.12)' }}>

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer"
        style={{ background: 'var(--bg2)', borderBottom: expanded ? '1px solid rgba(0,229,255,0.1)' : 'none' }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// SEND MESSAGE TO PARTICIPANTS</p>
          {recipientCount > 0 && (
            <span className="mono text-xs px-2 py-0.5 rounded"
              style={{ color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.2)', background: 'rgba(0,229,255,0.04)' }}>
              {recipientCount} recipient{recipientCount !== 1 ? 's' : ''}
            </span>
          )}
          {history.length > 0 && (
            <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
              {history.length} sent
            </span>
          )}
        </div>
        <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {expanded && (
        <div style={{ background: 'var(--bg)' }}>

          {/* Composer */}
          <div className="px-4 py-4 flex flex-col gap-3"
            style={{ borderBottom: '1px solid rgba(0,229,255,0.06)' }}>

            <div>
              <p className="mono text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>FROM</p>
              <p className="mono text-xs px-3 py-2 rounded"
                style={{ background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-dim)' }}>
                hello@biome.to (on behalf of your study)
              </p>
            </div>

            <div>
              <p className="mono text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>TO</p>
              <p className="mono text-xs px-3 py-2 rounded"
                style={{ background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-dim)' }}>
                {recipientCount} approved/enrolled participant{recipientCount !== 1 ? 's' : ''}
              </p>
            </div>

            <div>
              <p className="mono text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>SUBJECT</p>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Welcome to the study — next steps"
                maxLength={200}
                className="w-full mono text-sm px-3 py-2 rounded outline-none"
                style={{ background: 'var(--bg2)', border: '1px solid rgba(0,229,255,0.15)', color: 'var(--text-bright)' }}
              />
            </div>

            <div>
              <p className="mono text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>MESSAGE</p>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message to participants here. Be clear and concise."
                rows={6}
                maxLength={5000}
                className="w-full mono text-sm px-3 py-2 rounded outline-none resize-none"
                style={{ background: 'var(--bg2)', border: '1px solid rgba(0,229,255,0.15)', color: 'var(--text-bright)' }}
              />
              <p className="mono text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                {body.length}/5000
              </p>
            </div>

            <div>
              <p className="mono text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>ENROLLMENT / HANDOFF LINK (optional)</p>
              <input
                type="url"
                value={handoffUrl}
                onChange={(e) => setHandoffUrl(e.target.value)}
                placeholder="https://your-study-platform.com/enroll/..."
                className="w-full mono text-sm px-3 py-2 rounded outline-none"
                style={{
                  background: 'var(--bg2)',
                  border: `1px solid ${!urlValid ? 'rgba(255,100,100,0.4)' : 'rgba(0,229,255,0.15)'}`,
                  color: 'var(--text-bright)',
                }}
              />
              {!urlValid && (
                <p className="mono text-xs mt-1" style={{ color: '#ff8f8f' }}>Must start with https://</p>
              )}
              {urlValid && handoffUrl && (
                <p className="mono text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                  Participants will see this link as a button in their dashboard.
                </p>
              )}
            </div>

            {error && (
              <p className="mono text-xs" style={{ color: 'var(--amber)' }}>{error}</p>
            )}
            {success && (
              <p className="mono text-xs" style={{ color: 'var(--green)' }}>{success}</p>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleSend}
                disabled={sending || !subject.trim() || !body.trim() || !urlValid || recipientCount === 0}
                className="mono text-xs px-5 py-2.5 rounded font-bold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'var(--cyan)', color: '#050709' }}
              >
                {sending ? 'Sending...' : `Send to ${recipientCount} participant${recipientCount !== 1 ? 's' : ''} →`}
              </button>
              {recipientCount === 0 && (
                <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                  No approved participants yet
                </p>
              )}
            </div>
          </div>

          {/* Sent messages history */}
          {!loadingHist && history.length > 0 && (
            <div className="px-4 py-4">
              <p className="mono text-xs mb-3" style={{ color: 'var(--text-dim)' }}>
                // SENT MESSAGES [{history.length}]
              </p>
              <div className="flex flex-col gap-2">
                {history.map((msg) => (
                  <div key={msg.id} className="rounded px-3 py-3"
                    style={{ background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <p className="mono text-xs font-bold" style={{ color: 'var(--text-bright)' }}>
                        {msg.subject}
                      </p>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                          {msg.recipient_count} recipients
                        </span>
                        <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                          {relDate(msg.sent_at)}
                        </span>
                      </div>
                    </div>
                    <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)', whiteSpace: 'pre-wrap' }}>
                      {msg.body.length > 200 ? msg.body.slice(0, 200) + '…' : msg.body}
                    </p>
                    {msg.handoff_url && (
                      <p className="mono text-xs mt-1" style={{ color: 'var(--cyan)' }}>
                        Link: {msg.handoff_url}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
