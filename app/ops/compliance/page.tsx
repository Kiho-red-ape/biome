import { createServiceClient } from '@/lib/supabase/server';
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
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['App ID', 'Participant', 'Study', 'ICF Version', 'Consented At'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#4a6050', fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 24, color: '#4a6050', textAlign: 'center' }}>No consent records yet.</td></tr>
            )}
            {rows.map((r) => {
              const exp = r.experiments as { title: string } | null;
              return (
                <tr key={r.id as string} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '8px 12px', color: '#4a6050', fontSize: 10 }}>{(r.id as string).slice(0, 8)}…</td>
                  <td style={{ padding: '8px 12px', color: '#aab8b1', fontSize: 10 }}>{(r.participant_id as string).slice(0, 20)}…</td>
                  <td style={{ padding: '8px 12px', color: '#aab8b1' }}>{exp?.title?.slice(0, 30) ?? '—'}</td>
                  <td style={{ padding: '8px 12px', color: '#aab8b1' }}>{(r.study_agreement_version as string | null) ?? '1'}</td>
                  <td style={{ padding: '8px 12px', color: '#4a6050', whiteSpace: 'nowrap' }}>
                    {r.study_agreement_accepted_at ? new Date(r.study_agreement_accepted_at as string).toLocaleString() : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Recipient', 'Type', 'Message', 'Sent', 'Read'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#4a6050', fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 24, color: '#4a6050', textAlign: 'center' }}>No communications yet.</td></tr>
            )}
            {rows.map((n) => (
              <tr key={n.id as string} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '8px 12px', color: '#4a6050', fontSize: 10 }}>{(n.user_id as string).slice(0, 20)}…</td>
                <td style={{ padding: '8px 12px', color: '#aab8b1' }}>{n.type as string}</td>
                <td style={{ padding: '8px 12px', color: '#aab8b1', maxWidth: 300 }}>{(n.message as string).slice(0, 80)}</td>
                <td style={{ padding: '8px 12px', color: '#4a6050', whiteSpace: 'nowrap' }}>
                  {new Date(n.created_at as string).toLocaleDateString()}
                </td>
                <td style={{ padding: '8px 12px', color: n.is_read ? '#4a6050' : '#b7ff61' }}>
                  {n.is_read ? '✓' : '●'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (activeTab === 'export') {
    const { data: studies } = await db
      .from('experiments')
      .select('id, title, experiment_code')
      .order('created_at', { ascending: false });
    content = <ComplianceExport studies={(studies ?? []) as { id: string; title: string; experiment_code: string | null }[]} />;
  }

  return (
    <div>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px', color: '#ffb300', textTransform: 'uppercase', marginBottom: 20 }}>
        // COMPLIANCE
      </p>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 0 }}>
        {[
          { key: 'consent', label: 'Consent Audit' },
          { key: 'comms',   label: 'Communication Log' },
          { key: 'export',  label: 'Export' },
        ].map(({ key, label }) => (
          <a
            key={key}
            href={`/ops/compliance?tab=${key}`}
            style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      11,
              padding:       '8px 16px',
              color:         activeTab === key ? '#ffb300' : '#4a6050',
              textDecoration: 'none',
              borderBottom:  `2px solid ${activeTab === key ? '#ffb300' : 'transparent'}`,
              letterSpacing: '0.5px',
            }}
          >
            {label}
          </a>
        ))}
      </div>

      {content}
    </div>
  );
}
