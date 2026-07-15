import { createServiceClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { OpsPageHeader, OpsBadge, OpsTable, OpsTd, OpsEmpty } from '../_components/ui';

type StudyTone = 'teal' | 'green' | 'amber' | 'red' | 'slate' | 'blue';

function statusTone(s: string): StudyTone {
  if (s === 'recruiting') return 'blue';
  if (s === 'active')     return 'teal';
  if (s === 'completed')  return 'green';
  if (s === 'cancelled')  return 'red';
  return 'slate';
}

export default async function OpsStudies() {
  const db = createServiceClient();

  const { data: studies } = await db
    .from('experiments')
    .select('id, title, status, category, slots_filled, slots_total, bounty_per_participant, total_bounty_pool, is_verified, created_at, experiment_code')
    .order('created_at', { ascending: false });

  const rows = studies ?? [];

  return (
    <div>
      <OpsPageHeader
        label="Studies"
        title="All Studies"
        subtitle={`${rows.length} total experiment${rows.length === 1 ? '' : 's'}`}
      />

      <OpsTable head={['Code', 'Title', 'Status', 'Category', 'Slots', 'Bounty', 'Pool', 'Verified', 'Created']}>
        {rows.length === 0 && <OpsEmpty>No studies yet.</OpsEmpty>}
        {rows.map((s) => (
          <tr key={s.id}>
            <OpsTd mono dim nowrap>{(s.experiment_code as string | null) ?? '—'}</OpsTd>
            <OpsTd>
              <Link
                href={`/experiments/${s.id}`}
                target="_blank"
                style={{ color: 'var(--teal-dark)', textDecoration: 'none', fontFamily: 'var(--font-body)', fontSize: 13 }}
              >
                {(s.title as string).slice(0, 50)}{(s.title as string).length > 50 ? '…' : ''}
              </Link>
            </OpsTd>
            <OpsTd nowrap>
              <OpsBadge tone={statusTone(s.status as string)}>{s.status as string}</OpsBadge>
            </OpsTd>
            <OpsTd dim>{s.category as string}</OpsTd>
            <OpsTd mono dim nowrap>{s.slots_filled as number}/{s.slots_total as number}</OpsTd>
            <OpsTd mono nowrap>${s.bounty_per_participant as number}</OpsTd>
            <OpsTd mono dim nowrap>${(s.total_bounty_pool as number).toLocaleString()}</OpsTd>
            <OpsTd nowrap>
              {s.is_verified
                ? <OpsBadge tone="teal">Verified</OpsBadge>
                : <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>—</span>}
            </OpsTd>
            <OpsTd mono dim nowrap>
              {new Date(s.created_at as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </OpsTd>
          </tr>
        ))}
      </OpsTable>
    </div>
  );
}
