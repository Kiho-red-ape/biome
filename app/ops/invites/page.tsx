import { createServiceClient } from '@/lib/supabase/server';
import { OpsPageHeader, OpsStats, OpsCard, OpsBadge, OpsTable, OpsTd, OpsEmpty } from '../_components/ui';
import { CopyLink } from './copy-link';

type Tone = 'teal' | 'green' | 'amber' | 'red' | 'slate' | 'blue';

const SITE = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://biome.to';

const ORG_STATUS_TONE: Record<string, Tone> = {
  sent: 'amber', accepted: 'green', expired: 'slate', revoked: 'red',
};

function fmtDate(d: string | null): string {
  return d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

export default async function OpsInvitesPage() {
  const db = createServiceClient();

  const [{ data: orgInvitesRaw }, { data: teamRaw }] = await Promise.all([
    db.from('org_invites')
      .select('id, email, org_name, contact_name, invite_token, status, created_at, accepted_at, expires_at')
      .order('created_at', { ascending: false }),
    db.from('org_members')
      .select('id, org_id, email, role, status, invite_token, invited_at')
      .eq('status', 'invited')
      .order('invited_at', { ascending: false }),
  ]);

  const orgInvites = (orgInvitesRaw ?? []) as Array<{
    id: string; email: string; org_name: string | null; contact_name: string | null;
    invite_token: string; status: string; created_at: string; accepted_at: string | null; expires_at: string | null;
  }>;
  const team = (teamRaw ?? []) as Array<{
    id: string; org_id: string; email: string; role: string; invite_token: string | null; invited_at: string | null;
  }>;

  // Resolve org names for pending team invites.
  const orgIds = [...new Set(team.map((t) => t.org_id))];
  const orgNameById = new Map<string, string>();
  if (orgIds.length > 0) {
    const { data: orgs } = await db.from('experimenter_profiles').select('id, org_name').in('id', orgIds);
    for (const o of (orgs ?? []) as { id: string; org_name: string }[]) orgNameById.set(o.id, o.org_name);
  }

  const sent = orgInvites.filter((i) => i.status === 'sent').length;
  const accepted = orgInvites.filter((i) => i.status === 'accepted').length;

  return (
    <div>
      <OpsPageHeader
        label="Pipeline"
        title="Invites"
        subtitle="Org onboarding invites and pending team invites"
      />

      <OpsStats items={[
        { label: 'Org invites',     value: orgInvites.length, accent: true },
        { label: 'Awaiting accept', value: sent },
        { label: 'Accepted',        value: accepted },
        { label: 'Pending team',    value: team.length },
      ]} />

      {/* ── Org onboarding invites ── */}
      <div style={{ marginTop: 8, marginBottom: 12 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--slate)', marginBottom: 10 }}>
          Organization onboarding
        </p>
        <OpsTable head={['Organization', 'Email', 'Status', 'Sent', 'Accepted', 'Link']}>
          {orgInvites.length === 0 && <OpsEmpty>No org invites sent yet. Invite researchers from the pipeline.</OpsEmpty>}
          {orgInvites.map((i) => (
            <tr key={i.id}>
              <OpsTd>{i.org_name ?? i.contact_name ?? '—'}</OpsTd>
              <OpsTd mono dim nowrap>{i.email}</OpsTd>
              <OpsTd nowrap><OpsBadge tone={ORG_STATUS_TONE[i.status] ?? 'slate'}>{i.status}</OpsBadge></OpsTd>
              <OpsTd mono dim nowrap>{fmtDate(i.created_at)}</OpsTd>
              <OpsTd mono dim nowrap>{fmtDate(i.accepted_at)}</OpsTd>
              <OpsTd nowrap>
                {i.status === 'sent'
                  ? <CopyLink url={`${SITE}/invite/${i.invite_token}`} />
                  : <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>—</span>}
              </OpsTd>
            </tr>
          ))}
        </OpsTable>
      </div>

      {/* ── Pending team invites ── */}
      <div style={{ marginTop: 24 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--slate)', marginBottom: 10 }}>
          Pending team invites
        </p>
        {team.length === 0 ? (
          <OpsCard style={{ padding: '20px 24px' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)' }}>
              No pending team invites.
            </span>
          </OpsCard>
        ) : (
          <OpsTable head={['Organization', 'Invitee', 'Role', 'Invited', 'Link']}>
            {team.map((t) => (
              <tr key={t.id}>
                <OpsTd>{orgNameById.get(t.org_id) ?? '—'}</OpsTd>
                <OpsTd mono dim nowrap>{t.email}</OpsTd>
                <OpsTd nowrap><OpsBadge tone="blue">{t.role.replace('_', ' ')}</OpsBadge></OpsTd>
                <OpsTd mono dim nowrap>{fmtDate(t.invited_at)}</OpsTd>
                <OpsTd nowrap>
                  {t.invite_token
                    ? <CopyLink url={`${SITE}/team-invite/${t.invite_token}`} />
                    : <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>—</span>}
                </OpsTd>
              </tr>
            ))}
          </OpsTable>
        )}
      </div>
    </div>
  );
}
