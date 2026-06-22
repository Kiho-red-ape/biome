'use client';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { OpsPageHeader, OpsCard, OpsTable, OpsTd, OpsEmpty, OpsBadge, OpsButton, OpsAlert } from '../_components/ui';

type AdminProfile = {
  id:             string;
  display_name:   string | null;
  email:          string | null;
  is_admin:       boolean;
  is_super_admin: boolean;
  created_at:     string;
};

type MeStatus = { is_admin: boolean; is_super_admin: boolean };

const INPUT: React.CSSProperties = {
  flex:         '1 1 220px',
  padding:      '9px 12px',
  fontFamily:   'var(--font-mono)',
  fontSize:     12,
  background:   'var(--bg-page)',
  border:       '1px solid var(--border-mid)',
  borderRadius: 'var(--radius-sm)',
  color:        'var(--ink)',
  outline:      'none',
};

export default function AdminsPage() {
  const { user } = usePrivy();
  const privyDid = user?.id ?? null;

  const [me, setMe]             = useState<MeStatus | null>(null);
  const [admins, setAdmins]     = useState<AdminProfile[]>([]);
  const [loading, setLoading]   = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding]     = useState(false);
  const [toast, setToast]       = useState<{ ok: boolean; msg: string } | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  function flash(ok: boolean, msg: string) {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 4000);
  }

  async function load() {
    if (!privyDid) return;
    setLoading(true);
    try {
      const [meRes, adminsRes] = await Promise.all([
        fetch(`/api/ops/me?privyDid=${encodeURIComponent(privyDid)}`),
        fetch(`/api/ops/admins?privyDid=${encodeURIComponent(privyDid)}`),
      ]);
      const meData     = await meRes.json() as MeStatus;
      const adminsData = await adminsRes.json() as { admins?: AdminProfile[]; error?: string };
      setMe(meData);
      if (adminsData.admins) setAdmins(adminsData.admins);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [privyDid]);

  async function grantAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!privyDid || !newEmail.trim()) return;
    const email = newEmail.trim().toLowerCase();
    if (!email.endsWith('@biome.to')) {
      flash(false, 'Only @biome.to email addresses can be made admin.');
      return;
    }
    setAdding(true);
    const res = await fetch('/api/ops/admins', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ privyDid, targetEmail: email }),
    });
    const data = await res.json() as { ok?: boolean; error?: string };
    if (data.ok) {
      flash(true, `Admin access granted to ${email}.`);
      setNewEmail('');
      void load();
    } else {
      flash(false, data.error ?? 'Failed to grant admin.');
    }
    setAdding(false);
  }

  async function revokeAdmin(email: string) {
    if (!privyDid) return;
    setRevoking(email);
    const res = await fetch('/api/ops/admins', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ privyDid, targetEmail: email }),
    });
    const data = await res.json() as { ok?: boolean; error?: string };
    if (data.ok) {
      flash(true, `Admin access revoked for ${email}.`);
      void load();
    } else {
      flash(false, data.error ?? 'Failed to revoke admin.');
    }
    setRevoking(null);
  }

  const isSuperAdmin = me?.is_super_admin === true;

  return (
    <div style={{ maxWidth: 720 }}>
      <OpsPageHeader
        label="Team"
        title="Team & Admin Access"
        subtitle="Only @biome.to email addresses can hold admin access. Super admins can grant and revoke — regular admins cannot."
      />

      {toast && <OpsAlert tone={toast.ok ? 'ok' : 'err'}>{toast.msg}</OpsAlert>}

      {isSuperAdmin && (
        <OpsCard style={{ padding: '20px 20px', marginBottom: 28 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--teal-dark)', marginBottom: 14 }}>
            Grant admin access
          </p>
          <form onSubmit={(e) => void grantAdmin(e)} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="name@biome.to"
              required
              style={INPUT}
            />
            <OpsButton type="submit" disabled={adding} variant="primary">
              {adding ? 'Granting…' : 'Grant access'}
            </OpsButton>
          </form>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginTop: 10, marginBottom: 0 }}>
            The team member must have already signed in to Biome with their @biome.to email before you can grant access.
          </p>
        </OpsCard>
      )}

      <OpsTable head={['Team member', 'Role', isSuperAdmin ? 'Actions' : '']}>
        {loading && (
          <tr>
            <td colSpan={3} style={{ padding: '24px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
              Loading…
            </td>
          </tr>
        )}
        {!loading && admins.length === 0 && (
          <OpsEmpty>No @biome.to accounts found. Team members must sign in first.</OpsEmpty>
        )}
        {!loading && admins.map((a) => {
          const roleLabel   = a.is_super_admin ? 'Super admin' : a.is_admin ? 'Admin' : 'No access';
          const roleTone    = a.is_super_admin ? 'amber' : a.is_admin ? 'teal' : 'slate';
          const canRevoke   = isSuperAdmin && a.is_admin && !a.is_super_admin;

          return (
            <tr key={a.id}>
              <OpsTd>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink)', marginBottom: 2 }}>
                  {a.display_name ?? '—'}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                  {a.email}
                </div>
              </OpsTd>
              <OpsTd nowrap>
                <OpsBadge tone={roleTone as 'amber' | 'teal' | 'slate'}>{roleLabel}</OpsBadge>
              </OpsTd>
              <OpsTd nowrap>
                {canRevoke && (
                  <OpsButton
                    onClick={() => a.email && void revokeAdmin(a.email)}
                    disabled={revoking === a.email}
                    variant="danger"
                  >
                    {revoking === a.email ? 'Revoking…' : 'Revoke'}
                  </OpsButton>
                )}
                {a.is_super_admin && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>Protected</span>
                )}
              </OpsTd>
            </tr>
          );
        })}
      </OpsTable>

      <div style={{ marginTop: 20, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Super admin', desc: 'Full access + can manage team admins. Cannot be revoked via UI.' },
          { label: 'Admin',       desc: 'Full ops access. Cannot add or remove admins.' },
          { label: 'No access',   desc: 'Has a @biome.to account but no ops access yet.' },
        ].map((l) => (
          <span key={l.label} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
            <span style={{ color: 'var(--slate)' }}>{l.label}:</span> {l.desc}
          </span>
        ))}
      </div>
    </div>
  );
}
