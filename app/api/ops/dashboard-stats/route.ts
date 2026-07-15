import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const db = createServiceClient();

  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const today      = now.toISOString();

  const [
    { count: totalStudies },
    { count: activeStudies },
    { count: totalParticipants },
    { count: verifiedParticipants },
    { count: newIntakes },
    { count: qualifiedIntakes },
    { count: pendingPartners },
    { count: pendingApprovals },
    { count: kitsInTransit },
    { count: overdueKits },
    { count: pendingPayoutCount },
    leadsRes,
    mtdRevenueRes,
    pendingPayoutAmountRes,
    recentIntakesRes,
    recentPayoutsRes,
    recentPartnersRes,
  ] = await Promise.all([
    db.from('experiments').select('*', { count: 'exact', head: true }),
    db.from('experiments').select('*', { count: 'exact', head: true }).in('status', ['recruiting', 'active']),
    db.from('participant_profiles').select('*', { count: 'exact', head: true }),
    db.from('participant_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'fully_verified'),
    db.from('client_intakes').select('*', { count: 'exact', head: true }).eq('triage_status', 'new'),
    db.from('client_intakes').select('*', { count: 'exact', head: true }).eq('triage_status', 'qualified'),
    db.from('partner_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('experimenter_profiles').select('*', { count: 'exact', head: true }).eq('review_status', 'pending_review'),
    db.from('sample_kits').select('*', { count: 'exact', head: true }).eq('return_status', 'in_transit'),
    db.from('sample_kits').select('*', { count: 'exact', head: true })
      .neq('collection_status', 'collected')
      .not('collection_due_date', 'is', null)
      .lt('collection_due_date', today),
    db.from('applications').select('*', { count: 'exact', head: true }).eq('payout_status', 'pending'),
    db.from('estimate_leads').select('id, contacted'),
    db.from('applications').select('payout_net_amount').eq('payout_status', 'paid').gte('payout_completed_at', monthStart),
    db.from('applications').select('payout_net_amount').in('payout_status', ['pending', 'processing']),
    db.from('client_intakes').select('id, study_title, organization, name, created_at').order('created_at', { ascending: false }).limit(5),
    db.from('applications').select('id, payout_net_amount, payout_completed_at').eq('payout_status', 'paid').not('payout_completed_at', 'is', null).order('payout_completed_at', { ascending: false }).limit(4),
    db.from('partner_applications').select('id, name, category, created_at').order('created_at', { ascending: false }).limit(4),
  ]);

  const leads             = leadsRes.data ?? [];
  const uncontactedLeads  = leads.filter(l => !l.contacted).length;
  const mtdRevenue        = (mtdRevenueRes.data ?? []).reduce((s, r) => s + ((r.payout_net_amount as number) ?? 0), 0);
  const pendingPayoutTotal= (pendingPayoutAmountRes.data ?? []).reduce((s, r) => s + ((r.payout_net_amount as number) ?? 0), 0);

  interface ActivityItem { type: string; text: string; sub: string; time: string }
  const activity: ActivityItem[] = [
    ...(recentIntakesRes.data ?? []).map(i => ({
      type: 'intake',
      text: `New intake from ${(i.organization as string | null) ?? (i.name as string)}`,
      sub:  i.study_title as string,
      time: i.created_at as string,
    })),
    ...(recentPayoutsRes.data ?? []).map(p => ({
      type: 'payout',
      text: `Payout completed`,
      sub:  p.payout_net_amount != null ? `$${(p.payout_net_amount as number).toFixed(0)}` : '—',
      time: p.payout_completed_at as string,
    })),
    ...(recentPartnersRes.data ?? []).map(p => ({
      type: 'partner',
      text: `Partner application from ${p.name as string}`,
      sub:  (p.category as string | null) ?? '',
      time: p.created_at as string,
    })),
  ]
    .filter(a => !!a.time)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 10);

  return NextResponse.json({
    totalStudies:        totalStudies        ?? 0,
    activeStudies:       activeStudies       ?? 0,
    totalParticipants:   totalParticipants   ?? 0,
    verifiedParticipants:verifiedParticipants?? 0,
    newIntakes:          newIntakes          ?? 0,
    qualifiedIntakes:    qualifiedIntakes    ?? 0,
    pendingPartners:     pendingPartners     ?? 0,
    pendingApprovals:    pendingApprovals    ?? 0,
    kitsInTransit:       kitsInTransit       ?? 0,
    overdueKits:         overdueKits         ?? 0,
    pendingPayoutCount:  pendingPayoutCount  ?? 0,
    pendingPayoutTotal,
    mtdRevenue,
    uncontactedLeads,
    totalLeads:          leads.length,
    activity,
  });
}
