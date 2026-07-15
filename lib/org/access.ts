// Org access helpers — who may manage a study.

import { createServiceClient } from '@/lib/supabase/server';

type Db = ReturnType<typeof createServiceClient>;

// True if privyDid owns the experiment, or is an active member of the owning org
// with a managing role (admin / researcher / clinical_operator).
export async function canManageExperiment(db: Db, privyDid: string, experimentId: string): Promise<boolean> {
  const { data: exp } = await db
    .from('experiments')
    .select('experimenter_id')
    .eq('id', experimentId)
    .maybeSingle();
  const ownerId = (exp as { experimenter_id: string } | null)?.experimenter_id;
  if (!ownerId) return false;
  if (ownerId === privyDid) return true;

  // Resolve the org and check membership.
  const { data: org } = await db
    .from('experimenter_profiles')
    .select('id')
    .eq('user_id', ownerId)
    .maybeSingle();
  const orgId = (org as { id: string } | null)?.id;
  if (!orgId) return false;

  const { data: member } = await db
    .from('org_members')
    .select('role, status')
    .eq('org_id', orgId)
    .eq('user_id', privyDid)
    .eq('status', 'active')
    .maybeSingle();
  const role = (member as { role: string } | null)?.role;
  return role === 'admin' || role === 'researcher' || role === 'clinical_operator';
}
