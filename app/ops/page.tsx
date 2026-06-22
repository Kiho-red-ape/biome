import { createServiceClient } from '@/lib/supabase/server';
import { OpsPageHeader, OpsStats } from './_components/ui';

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
      <OpsPageHeader
        label="Overview"
        title="Operator Console"
        subtitle="All counts are live from the database. Use the sidebar to navigate."
      />

      <OpsStats items={[
        { label: 'Active studies',    value: `${activeStudies ?? 0} / ${totalStudies ?? 0}`, accent: true },
        { label: 'Participants',      value: totalParticipants ?? 0, accent: true },
        { label: 'Verified',          value: verifiedParticipants ?? 0 },
        { label: 'Kits pending ship', value: pendingKits ?? 0 },
        { label: 'Payouts pending',   value: pendingPayouts ?? 0 },
        { label: 'New intakes',       value: newIntakes ?? 0 },
        { label: 'Partner apps',      value: pendingPartners ?? 0 },
      ]} />
    </div>
  );
}
