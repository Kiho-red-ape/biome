import { createServiceClient } from '@/lib/supabase/server';

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      background:   '#0b1014',
      border:       '1px solid rgba(255,179,0,0.1)',
      padding:      '16px 20px',
      borderRadius: 2,
      minWidth:     160,
    }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', color: '#ffb300', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 28, color: '#f2faf4', lineHeight: 1 }}>
        {value}
      </p>
      {sub && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a6050', marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

export default async function OpsOverview() {
  const db = createServiceClient();

  const [
    { count: totalStudies },
    { count: activeStudies },
    { count: totalParticipants },
    { count: verifiedParticipants },
    { count: pendingKits },
    { count: pendingPayouts },
    { count: newIntakes },
    { count: pendingPartners },
  ] = await Promise.all([
    db.from('experiments').select('*', { count: 'exact', head: true }),
    db.from('experiments').select('*', { count: 'exact', head: true }).in('status', ['recruiting', 'active']),
    db.from('participant_profiles').select('*', { count: 'exact', head: true }),
    db.from('participant_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'fully_verified'),
    db.from('sample_kits').select('*', { count: 'exact', head: true }).eq('ship_status', 'pending'),
    db.from('applications').select('*', { count: 'exact', head: true }).eq('payout_status', 'pending'),
    db.from('client_intakes').select('*', { count: 'exact', head: true }).eq('triage_status', 'new'),
    db.from('partner_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  return (
    <div>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px', color: '#ffb300', textTransform: 'uppercase', marginBottom: 20 }}>
        // OVERVIEW
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 40 }}>
        <Stat label="Active studies"      value={activeStudies ?? 0}       sub={`${totalStudies ?? 0} total`} />
        <Stat label="Participants"        value={totalParticipants ?? 0}    sub={`${verifiedParticipants ?? 0} verified`} />
        <Stat label="Kits pending ship"   value={pendingKits ?? 0} />
        <Stat label="Payouts pending"     value={pendingPayouts ?? 0} />
        <Stat label="New intakes"         value={newIntakes ?? 0} />
        <Stat label="Partner apps"        value={pendingPartners ?? 0}      sub="pending review" />
      </div>

      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4a6050', lineHeight: 2 }}>
        Use the sidebar to navigate. All counts are live from the database.
      </p>
    </div>
  );
}
