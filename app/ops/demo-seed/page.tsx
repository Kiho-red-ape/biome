'use client';

import { useState } from 'react';
import { OpsPageHeader, OpsCard, OpsAlert } from '../_components/ui';

const DEMO_ACCOUNTS = [
  { demoId: 'demo:researcher',  email: 'researcher@biome.to',  role: 'Researcher',  note: 'Has a live study (Gut Microbiome & Diet Correlation)' },
  { demoId: 'demo:participant', email: 'participant@biome.to', role: 'Participant', note: 'Enrolled in the demo study with 2 verified milestones' },
  { demoId: 'demo:partner',     email: 'partner@biome.to',    role: 'Partner',     note: 'Researcher profile — Wellness Research Partners' },
];

const INPUT: React.CSSProperties = {
  fontFamily:   'var(--font-mono)',
  fontSize:     12,
  color:        'var(--ink)',
  background:   'var(--bg-page)',
  border:       '1px solid var(--border-mid)',
  borderRadius: 'var(--radius-sm)',
  padding:      '8px 12px',
  outline:      'none',
  boxSizing:    'border-box',
};

function Row({ account }: { account: typeof DEMO_ACCOUNTS[0] }) {
  const [realDid, setRealDid] = useState('');
  const [status,  setStatus]  = useState<{ ok: boolean; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function relink() {
    if (!realDid.trim()) { setStatus({ ok: false, msg: 'Enter the real Privy DID.' }); return; }
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/ops/seed-demo', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ demoId: account.demoId, realDid: realDid.trim() }),
      });
      const data = await res.json() as { ok?: boolean; message?: string; error?: string };
      setStatus({ ok: !!data.ok, msg: data.ok ? (data.message ?? 'Relinked.') : (data.error ?? 'Failed.') });
    } catch (e) {
      setStatus({ ok: false, msg: String(e) });
    }
    setLoading(false);
  }

  return (
    <OpsCard style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--ink)', marginBottom: 2 }}>
            {account.email}
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--teal-dark)', marginBottom: 6 }}>
            {account.role}
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)' }}>{account.note}</p>
        </div>
        <span style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      10,
          color:         'var(--muted)',
          border:        '1px solid var(--border-soft)',
          padding:       '3px 10px',
          borderRadius:  'var(--radius-sm)',
          whiteSpace:    'nowrap',
        }}>
          {account.demoId}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          value={realDid}
          onChange={(e) => setRealDid(e.target.value)}
          placeholder="did:privy:xxxxxxxx (from Privy dashboard after first login)"
          style={{ ...INPUT, flex: 1, minWidth: 280 }}
        />
        <button
          type="button"
          onClick={() => void relink()}
          disabled={loading}
          style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      11,
            fontWeight:    600,
            letterSpacing: '0.5px',
            padding:       '8px 20px',
            background:    'var(--teal)',
            border:        '1px solid var(--teal)',
            color:         '#fff',
            borderRadius:  'var(--radius-sm)',
            cursor:        loading ? 'default' : 'pointer',
            opacity:       loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Linking…' : 'Relink →'}
        </button>
      </div>

      {status && (
        <div style={{ marginTop: 10 }}>
          <OpsAlert tone={status.ok ? 'ok' : 'err'}>{status.ok ? `✓ ${status.msg}` : `✗ ${status.msg}`}</OpsAlert>
        </div>
      )}
    </OpsCard>
  );
}

export default function DemoSeedPage() {
  return (
    <div style={{ maxWidth: 760 }}>
      <OpsPageHeader
        label="Demo"
        title="Demo Account Setup"
        subtitle="Seed data is pre-inserted with placeholder IDs. After each email account first logs in via Privy, get their real DID and use the relink tool below."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        {DEMO_ACCOUNTS.map(a => <Row key={a.demoId} account={a} />)}
      </div>

      <OpsCard style={{ padding: '16px 20px' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--teal-dark)', marginBottom: 10 }}>
          How to find a Privy DID
        </p>
        <ol style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)', lineHeight: 2, paddingLeft: 20, margin: 0 }}>
          <li>Open the Privy dashboard → Users</li>
          <li>Search for the email address</li>
          <li>Click the user row — the DID is the ID column (format: did:privy:xxxxxxxx)</li>
          <li>Paste it above and click Relink</li>
        </ol>
      </OpsCard>
    </div>
  );
}
