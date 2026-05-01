import { createServiceClient } from '@/lib/supabase/server';
import Image from 'next/image';
import { PartnerActions } from './partner-actions';

export default async function OpsPartners({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const db = createServiceClient();

  const filterStatus = status ?? 'pending';

  const { data: partners } = await db
    .from('partner_applications')
    .select('*')
    .eq('status', filterStatus)
    .order('created_at', { ascending: false });

  const rows = (partners ?? []) as Record<string, unknown>[];
  const title = filterStatus === 'approved' ? 'APPROVED_PARTNERS' : 'PARTNER_APPLICATIONS';

  return (
    <div>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px', color: '#ffb300', textTransform: 'uppercase', marginBottom: 20 }}>
        // {title}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {rows.length === 0 && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4a6050' }}>No {filterStatus} partner applications.</p>
        )}
        {rows.map((p) => (
          <div key={p.id as string} style={{
            background: '#0b1014', border: '1px solid rgba(255,255,255,0.06)',
            padding: '20px 24px', borderRadius: 2,
            display: 'flex', gap: 20, alignItems: 'flex-start',
          }}>
            {/* Logo */}
            {(p.logo_url as string | null) && (
              <div style={{ flexShrink: 0, width: 64, height: 64, background: 'rgba(255,255,255,0.03)', borderRadius: 2, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Image src={p.logo_url as string} alt={p.name as string} width={64} height={64} style={{ objectFit: 'contain' }} />
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#f2faf4', marginBottom: 2 }}>{p.name as string}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a6050' }}>
                    {p.category as string} · {(p.region as string | null) ?? 'Region not specified'} · {p.email as string}
                  </p>
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: p.status === 'approved' ? '#b7ff61' : p.status === 'rejected' ? '#4a6050' : '#ffb300',
                  padding: '3px 10px', background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)', borderRadius: 2, letterSpacing: '1px',
                  textTransform: 'uppercase', alignSelf: 'flex-start',
                }}>
                  {p.status as string}
                </span>
              </div>

              {(p.description as string | null) && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#aab8b1', lineHeight: 1.6, marginBottom: 12 }}>
                  {p.description as string}
                </p>
              )}

              <PartnerActions
                partnerId={p.id as string}
                currentStatus={p.status as string}
                displayOnHomepage={p.display_on_homepage as boolean}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
