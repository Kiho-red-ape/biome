// Resolve the org a user belongs to (as founding admin or active member).

import { createServiceClient } from '@/lib/supabase/server';
import type { OrgRole } from '@/lib/org/invites';

type Db = ReturnType<typeof createServiceClient>;

export interface ResolvedOrg {
  orgId: string;
  ownerId: string;
  role: OrgRole;
  isAdmin: boolean;
}

export async function resolveOrgForUser(db: Db, privyDid: string): Promise<ResolvedOrg | null> {
  // Founding admin path: they own an experimenter_profile.
  const { data: owned } = await db
    .from('experimenter_profiles')
    .select('id, user_id')
    .eq('user_id', privyDid)
    .maybeSingle();
  if (owned) {
    const o = owned as { id: string; user_id: string };
    return { orgId: o.id, ownerId: o.user_id, role: 'admin', isAdmin: true };
  }

  // Member path: active org_members row.
  const { data: member } = await db
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', privyDid)
    .eq('status', 'active')
    .maybeSingle();
  if (!member) return null;

  const m = member as { org_id: string; role: OrgRole };
  const { data: org } = await db
    .from('experimenter_profiles').select('user_id').eq('id', m.org_id).maybeSingle();
  return {
    orgId:  m.org_id,
    ownerId: (org as { user_id: string } | null)?.user_id ?? '',
    role:    m.role,
    isAdmin: m.role === 'admin',
  };
}
