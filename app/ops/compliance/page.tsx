import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { OpsPageHeader, OpsCard, OpsTable, OpsTd, OpsEmpty, OpsBadge } from '../_components/ui';
import { ComplianceExport } from './compliance-export';

export default async function OpsCompliance({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab ?? 'consent';
  const db = createServiceClient();

  let content: React.ReactNode = null;

  if (activeTab === 'consent') {
    const { data: consents } = await db
      .from('applications')
      .select('id, participant_id, experiment_id, study_agreement_accepted_at, study_agreement_version, experiments(title)')
      .not('study_agreement_accepted_at', 'is', null)
      .order('study_agreement_accepted_at', { ascending: false })
      .limit(100);

    const rows = (consents ?? []) as Record<string, unknown>[];
    content = (
      <OpsTable head={['App ID', 'Participant', 'Study', 'ICF Version', 'Consented At']}>
        {rows.length === 0 && <OpsEmpty>No consent records yet.</OpsEmpty>}
        {rows.map((r) => {
          const exp = r.experiments as { title: string } | null;
          return (
            <tr key={r.id as string}>
              <OpsTd mono dim nowrap>{(r.id as string).slice(0, 8)}…</OpsTd>
              <OpsTd mono dim nowrap>{(r.participant_id as string).slice(0, 20)}…</OpsTd>
              <OpsTd>{exp?.title?.slice(0, 30) ?? '—'}</OpsTd>
              <OpsTd mono dim>{(r.study_agreement_version as string | null) ?? '1'}</OpsTd>
              <OpsTd mono dim nowrap>
                {r.study_agreement_accepted_at
                  ? new Date(r.study_agreement_accepted_at as string).toLocaleString()
                  : '—'}
              </OpsTd>
            </tr>
          );
        })}
      </OpsTable>
    );
  }

  if (activeTab === 'comms') {
    const { data: notifs } = await db
      .from('notifications')
      .select('id, user_id, type, message, created_at, is_read')
      .order('created_at', { ascending: false })
      .limit(200);

    const rows = (notifs ?? []) as Record<string, unknown>[];
    content = (
      <OpsTable head={['Recipient', 'Type', 'Message', 'Sent', 'Read']}>
        {rows.length === 0 && <OpsEmpty>No communications yet.</OpsEmpty>}
        {rows.map((n) => (
          <tr key={n.id as string}>
            <OpsTd mono dim nowrap>{(n.user_id as string).slice(0, 20)}…</OpsTd>
            <OpsTd nowrap><OpsBadge tone="slate">{n.type as string}</OpsBadge></OpsTd>
            <OpsTd>{(n.message as string).slice(0, 80)}</OpsTd>
            <OpsTd mono dim nowrap>
              {new Date(n.created_at as string).toLocaleDateString()}
            </OpsTd>
            <OpsTd nowrap>
              {n.is_read
                ? <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>Read</span>
                : <OpsBadge tone="amber">Unread</OpsBadge>}
            </OpsTd>
          </tr>
        ))}
      </OpsTable>
    );
  }

  if (activeTab === 'export') {
    const { data: studies } = await db
      .from('experiments')
      .select('id, title, experiment_code')
      .order('created_at', { ascending: false });
    content = <ComplianceExport studies={(studies ?? []) as { id: string; title: string; experiment_code: string | null }[]} />;
  }

  const tabs = [
    { key: 'consent', label: 'Consent Audit' },
    { key: 'comms',   label: 'Communication Log' },
    { key: 'export',  label: 'Export' },
  ];

  return (
    <div>
      <OpsPageHeader label="Compliance" title="Compliance" />

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {tabs.map(({ key, label }) => {
          const on = activeTab === key;
          return (
            <Link
              key={key}
              href={`/ops/compliance?tab=${key}`}
              style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      11,
                fontWeight:    600,
                letterSpacing: '0.5px',
                padding:       '6px 14px',
                borderRadius:  999,
                border:        `1px solid ${on ? 'var(--teal)' : 'var(--border-mid)'}`,
                background:    on ? 'var(--teal-soft)' : 'var(--surface)',
                color:         on ? 'var(--teal-dark)' : 'var(--slate)',
                textDecoration: 'none',
                whiteSpace:    'nowrap',
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {content}
    </div>
  );
}
