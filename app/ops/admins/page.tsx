'use client';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';

type AdminProfile = {
  id:             string;
  display_name:   string | null;
  email:          string | null;
  is_admin:       boolean;
  is_super_admin: boolean;
  created_at:     string;
};

type MeStatus = { is_admin: boolean; is_super_admin: boolean };

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)' };

function Badge({ label, variant }: { label: string; variant: 'super' | 'admin' | 'none' }) {
  const styles: Record<string, React.CSSProperties> = {
    super: { background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' },
    admin: { background: 'rgba(56,189,248,0.08)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.25)' },
    none:  { background: 'rgba(255,255,255,0.04)', color: '#475569', border: '1px solid rgba(255,255,255,0.08)' },
  };
  return (
    <span style={{
      ...MONO, fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
      padding: '3px 10px', borderRadius: 3, display: 'inline-block',
      ...styles[variant],
    }}>
      {label}
    </span>
  );
}

export default function AdminsPage() {
  const { user } = usePrivy();
  const privyDid = user?.id ?? null;

  const [me, setMe]             = useState<MeStatus | null>(null);
  const [admins, setAdmins]     = useState<AdminProfile[]>([]);
  const [loading, setLoading]   = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  function flash(type: 'ok' | 'err', msg: string) {
    if (type === 'ok') { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); }
    else               { setError(msg);   setTimeout(() => setError(null),   4000); }
  }

  async function load() {
    if (!privyDid) return;
    setLoading(true);
    try {
      const [meRes, adminsRes] = await Promise.all([
        fetch(`/api/ops/me?privyDid=${encodeURIComponent(privyDid)}`),
        fetch(`/api/ops/admins?privyDid=${encodeURIComponent(privyDid)}`),
      ]);
      const meData    = await meRes.json() as MeStatus;
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
      flash('err', 'Only @biome.to email addresses can be made admin.');
      return;
    }
    setAdding(true);
    const res = await fetch('/api/ops/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ privyDid, targetEmail: email }),
    });
    const data = await res.json() as { ok?: boolean; error?: string };
    if (data.ok) {
      flash('ok', `Admin access granted to ${email}.`);
      setNewEmail('');
      void load();
    } else {
      flash('err', data.error ?? 'Failed to grant admin.');
    }
    setAdding(false);
  }

  async function revokeAdmin(email: string) {
    if (!privyDid) return;
    setRevoking(email);
    const res = await fetch('/api/ops/admins', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ privyDid, targetEmail: email }),
    });
    const data = await res.json() as { ok?: boolean; error?: string };
    if (data.ok) {
      flash('ok', `Admin access revoked for ${email}.`);
      void load();
    } else {
      flash('err', data.error ?? 'Failed to revoke admin.');
    }
    setRevoking(null);
  }

  const isSuperAdmin = me?.is_super_admin === true;

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ ...MONO, fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', color: '#f59e0b', marginBottom: 8 }}>
          // TEAM_AND_ADMINS
        </p>
        <h1 style={{ ...MONO, fontSize: 18, fontWeight: 700, color: '#f8fafc', margin: '0 0 6px' }}>
          Team & Admin Access
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#475569', margin: 0 }}>
          Only <span style={{ ...MONO, fontSize: 12, color: '#94a3b8' }}>@biome.to</span> email addresses can hold admin access.
          Super admins can grant and revoke admin — regular admins cannot.
        </p>
      </div>

      {/* Toast */}
      {success && (
        <div style={{ ...MONO, fontSize: 12, color: '#4ade80', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 4, padding: '10px 16px', marginBottom: 20 }}>
          ✓ {success}
        </div>
      )}
      {error && (
        <div style={{ ...MONO, fontSize: 12, color: '#f87171', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 4, padding: '10px 16px', marginBottom: 20 }}>
          ✗ {error}
        </div>
      )}

      {/* Grant admin form — super admin only */}
      {isSuperAdmin && (
        <div style={{
          background: 'rgba(245,158,11,0.04)',
          border: '1px solid rgba(245,158,11,0.14)',
          borderRadius: 4,
          padding: '20px 20px',
          marginBottom: 28,
        }}>
          <p style={{ ...MONO, fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: '#f59e0b', marginBottom: 14 }}>
            Grant admin access
          </p>
          <form onSubmit={(e) => void grantAdmin(e)} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="name@biome.to"
              required
              style={{
                flex: '1 1 220px',
                padding: '9px 12px',
                ...MONO, fontSize: 12,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 3,
                color: '#f8fafc',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={adding}
              style={{
                padding: '9px 20px',
                ...MONO, fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
                background: adding ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.3)',
                color: '#f59e0b',
                borderRadius: 3,
                cursor: adding ? 'default' : 'pointer',
              }}
            >
              {adding ? 'Granting…' : 'Grant access'}
            </button>
          </form>
          <p style={{ ...MONO, fontSize: 10, color: '#475569', marginTop: 10, marginBottom: 0 }}>
            The team member must have already signed in to Biome with their @biome.to email before you can grant access.
          </p>
        </div>
      )}

      {/* Current team table */}
      <div style={{
        background: '#0b1014',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 140px 120px',
          padding: '10px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
        }}>
          {['Team member', 'Role', isSuperAdmin ? 'Actions' : ''].map((h) => (
            <span key={h} style={{ ...MONO, fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#475569' }}>
              {h}
            </span>
          ))}
        </div>

        {loading && (
          <div style={{ padding: '24px 16px', ...MONO, fontSize: 12, color: '#475569' }}>
            Loading…
          </div>
        )}

        {!loading && admins.length === 0 && (
          <div style={{ padding: '24px 16px', ...MONO, fontSize: 12, color: '#475569' }}>
            No @biome.to accounts found. Team members must sign in first.
          </div>
        )}

        {!loading && admins.map((a) => {
          const roleLabel = a.is_super_admin ? 'Super admin' : a.is_admin ? 'Admin' : 'No access';
          const roleVariant = a.is_super_admin ? 'super' : a.is_admin ? 'admin' : 'none';
          const canRevoke = isSuperAdmin && a.is_admin && !a.is_super_admin;

          return (
            <div
              key={a.id}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 140px 120px',
                alignItems: 'center',
                padding: '13px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#f8fafc' }}>
                  {a.display_name ?? '—'}
                </div>
                <div style={{ ...MONO, fontSize: 11, color: '#475569', marginTop: 2 }}>
                  {a.email}
                </div>
              </div>

              <div>
                <Badge label={roleLabel} variant={roleVariant} />
              </div>

              <div>
                {canRevoke && (
                  <button
                    onClick={() => a.email && void revokeAdmin(a.email)}
                    disabled={revoking === a.email}
                    style={{
                      ...MONO, fontSize: 10, letterSpacing: '0.5px', textTransform: 'uppercase',
                      padding: '5px 12px',
                      background: 'transparent',
                      border: '1px solid rgba(248,113,113,0.25)',
                      color: '#f87171',
                      borderRadius: 3,
                      cursor: revoking === a.email ? 'default' : 'pointer',
                      opacity: revoking === a.email ? 0.5 : 1,
                    }}
                  >
                    {revoking === a.email ? 'Revoking…' : 'Revoke'}
                  </button>
                )}
                {a.is_super_admin && (
                  <span style={{ ...MONO, fontSize: 10, color: '#475569' }}>Protected</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 20, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Super admin', desc: 'Full access + can manage team admins. Cannot be revoked via UI.' },
          { label: 'Admin', desc: 'Full ops access. Cannot add or remove admins.' },
          { label: 'No access', desc: 'Has a @biome.to account but no ops access yet.' },
        ].map((l) => (
          <div key={l.label} style={{ display: 'flex', gap: 6 }}>
            <span style={{ ...MONO, fontSize: 10, color: '#475569' }}>
              <span style={{ color: '#94a3b8' }}>{l.label}:</span> {l.desc}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
