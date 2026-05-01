import { createServiceClient } from '@/lib/supabase/server';
import { KitStatusUpdater } from './kit-status-updater';

function isOverdue(kit: Record<string, unknown>): boolean {
  if (kit.collection_status === 'collected') return false;
  if (!kit.collection_due_date) return false;
  return new Date(kit.collection_due_date as string) < new Date();
}

export default async function OpsLogistics({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const db = createServiceClient();

  let query = db
    .from('sample_kits')
    .select('*, experiments(title)')
    .order('created_at', { ascending: false });

  if (status === 'pending')    query = query.eq('ship_status', 'pending');
  if (status === 'awaiting')   query = query.eq('collection_status', 'awaiting');
  if (status === 'in_transit') query = query.eq('return_status', 'in_transit');

  const { data: kits } = await query;
  let rows = (kits ?? []) as Record<string, unknown>[];
  if (status === 'overdue') rows = rows.filter(isOverdue);

  const title = status === 'pending'    ? 'PENDING_SHIPMENT'
    : status === 'awaiting'   ? 'AWAITING_COLLECTION'
    : status === 'in_transit' ? 'IN_TRANSIT_TO_LAB'
    : status === 'overdue'    ? 'OVERDUE_KITS'
    : 'ALL_KITS';

  return (
    <div>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px', color: '#ffb300', textTransform: 'uppercase', marginBottom: 20 }}>
        // {title}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.length === 0 && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4a6050' }}>No kits found.</p>
        )}
        {rows.map((kit) => {
          const overdue = isOverdue(kit);
          const exp = kit.experiments as { title: string } | null;
          return (
            <div key={kit.id as string} style={{
              background:   '#0b1014',
              border:       `1px solid ${overdue ? 'rgba(255,179,0,0.2)' : 'rgba(255,255,255,0.06)'}`,
              padding:      '16px 20px',
              borderRadius: 2,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#f2faf4', marginBottom: 2 }}>
                    {kit.kit_type as string} kit · {kit.participant_id as string}
                    {overdue && <span style={{ color: '#ffb300', marginLeft: 8 }}>⚠ OVERDUE</span>}
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a6050' }}>
                    {exp?.title ?? 'Unknown study'} · Created {new Date(kit.created_at as string).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Status pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {[
                  ['Ship', kit.ship_status as string],
                  ['Collect', kit.collection_status as string],
                  ['Return', kit.return_status as string],
                ].map(([label, val]) => (
                  <span key={label} style={{
                    fontFamily:    'var(--font-mono)',
                    fontSize:      10,
                    padding:       '3px 10px',
                    background:    'rgba(255,255,255,0.03)',
                    border:        '1px solid rgba(255,255,255,0.07)',
                    color:         '#aab8b1',
                    borderRadius:  2,
                    letterSpacing: '0.5px',
                  }}>
                    {label}: <span style={{ color: '#f2faf4' }}>{val}</span>
                  </span>
                ))}
              </div>

              <KitStatusUpdater kitId={kit.id as string} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
