// Helpers for org invites (ops → researcher) and org team membership.

import { randomBytes } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';

export type OrgRole = 'admin' | 'clinical_operator' | 'researcher' | 'sponsor';

type Db = ReturnType<typeof createServiceClient>;

export function generateToken(): string {
  return randomBytes(24).toString('base64url');
}

// Ensure the org's founding user has an active admin membership. Idempotent.
export async function ensureAdminMember(
  orgId: string,
  userId: string,
  email: string,
  db?: Db,
): Promise<void> {
  const supabase = db ?? createServiceClient();
  await supabase.from('org_members').upsert(
    {
      org_id:     orgId,
      user_id:    userId,
      email:      email.toLowerCase(),
      role:       'admin',
      status:     'active',
      accepted_at: new Date().toISOString(),
    },
    { onConflict: 'org_id,email' },
  );
}
