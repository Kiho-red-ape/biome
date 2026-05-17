'use client';

import { useState } from 'react';

const DEMO_ACCOUNTS = [
  { demoId: 'demo:researcher', email: 'researcher@biome.to', role: 'Researcher',  note: 'Has a live study (Gut Microbiome & Diet Correlation)' },
  { demoId: 'demo:participant', email: 'participant@biome.to', role: 'Participant', note: 'Enrolled in the demo study with 2 verified milestones' },
  { demoId: 'demo:partner', email: 'partner@biome.to', role: 'Partner',         note: 'Researcher profile — Wellness Research Partners' },
];

function Row({ account }: { account: typeof DEMO_ACCOUNTS[0] }) {
  const [realDid, setRealDid] = useState('');
  const [status,  setStatus]  = useState('');
  const [loading, setLoading] = useState(false);

  async function relink() {
    if (!realDid.trim()) { setStatus('Enter the real Privy DID.'); return; }
    setLoading(true);
    setStatus('');
    try {
      const res = await fetch('/api/ops/seed-demo', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ demoId: account.demoId, realDid: realDid.trim() }),
      });
      const data = await res.json() as { ok?: boolean; message?: string; error?: string };
      setStatus(data.ok ? `✓ ${data.message}` : `✗ ${data.error}`);
    } catch (e) {
      setStatus(`✗ ${String(e)}`);
    }
    setLoading(false);
  }

  const MONO = 'var(--font-mono)';

  return (
    <div style={{
      background: '#0b1014', border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 2, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ fontFamily: MONO, fontSize: 12, color: '#f2faf4', marginBottom: 2 }}>{account.email}</p>
          <p style={{ fontFamily: MONO, fontSize: 10, color: '#ffb300', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>{account.role}</p>
          <p style={{ fontFamily: MONO, fontSize: 11, color: '#5b8a9a' }}>{account.note}</p>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: '#3a4a43', border: '1px solid rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: 2 }}>
          placeholder id: {account.demoId}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          value={realDid}
          onChange={(e) => setRealDid(e.target.value)}
          placeholder="did:privy:xxxxxxxx (from Privy dashboard after first login)"
          style={{
            fontFamily: MONO, fontSize: 11, flex: 1, minWidth: 280,
            padding: '8px 12px', background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2,
            color: '#f2faf4', outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={relink}
          disabled={loading}
          style={{
            fontFamily: MONO, fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase',
            padding: '8px 20px', background: 'rgba(255,179,0,0.1)', border: '1px solid rgba(255,179,0,0.3)',
            color: '#ffb300', borderRadius: 2, cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Linking…' : 'Relink →'}
        </button>
      </div>

      {status && (
        <p style={{ fontFamily: MONO, fontSize: 11, color: status.startsWith('✓') ? '#b7ff61' : '#ff6464', lineHeight: 1.5 }}>
          {status}
        </p>
      )}
    </div>
  );
}

export default function DemoSeedPage() {
  const MONO = 'var(--font-mono)';
  return (
    <div style={{ maxWidth: 760 }}>
      <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '3px', color: '#ffb300', textTransform: 'uppercase', marginBottom: 8 }}>
        // DEMO_SEED
      </p>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 22, color: '#f2faf4', marginBottom: 8 }}>
        Demo account setup
      </h1>
      <p style={{ fontFamily: MONO, fontSize: 12, color: '#5b8a9a', lineHeight: 1.8, marginBottom: 32, maxWidth: 600 }}>
        Seed data is pre-inserted with placeholder IDs (demo:researcher, demo:participant, demo:partner).
        After each email account first logs in via Privy, get their real DID from the Privy dashboard
        and use the relink tool below to attach the real DID to the pre-seeded profile.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {DEMO_ACCOUNTS.map(a => <Row key={a.demoId} account={a} />)}
      </div>

      <div style={{ marginTop: 40, padding: '16px 20px', border: '1px solid rgba(255,179,0,0.1)', borderRadius: 2, background: 'rgba(255,179,0,0.02)' }}>
        <p style={{ fontFamily: MONO, fontSize: 11, color: '#ffb300', marginBottom: 8 }}>HOW TO FIND A PRIVY DID</p>
        <p style={{ fontFamily: MONO, fontSize: 11, color: '#5b8a9a', lineHeight: 1.8 }}>
          1. Open the Privy dashboard → Users{'\n'}
          2. Search for the email address{'\n'}
          3. Click the user row — the DID is the ID column (format: did:privy:xxxxxxxx){'\n'}
          4. Paste it above and click Relink
        </p>
      </div>
    </div>
  );
}
