import { createServiceClient } from '@/lib/supabase/server';
import type { ClearanceLevel, StudyDocument } from './types';

// Returns the effective clearance level for a user relative to a study.
// operator    → can see everything
// researcher  → can see researcher + participant + public docs on own studies
// participant → can see participant + public docs on enrolled studies
// none        → public only
export type UserClearance = 'operator' | 'researcher' | 'participant' | 'none';

export async function getUserClearance(
  privyDid: string,
  experimentId: string,
): Promise<UserClearance> {
  const supabase = createServiceClient();

  // Is admin/operator?
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, email')
    .eq('id', privyDid)
    .single();

  if (profile?.is_admin || profile?.email === 'kishore@biome.to') return 'operator';

  // Is the researcher who owns this study?
  const { data: exp } = await supabase
    .from('experiments')
    .select('experimenter_id')
    .eq('id', experimentId)
    .single();

  if (exp?.experimenter_id === privyDid) return 'researcher';

  // Is an enrolled participant?
  const { data: app } = await supabase
    .from('applications')
    .select('id, status')
    .eq('experiment_id', experimentId)
    .eq('participant_id', privyDid)
    .in('status', ['approved', 'active', 'completed'])
    .maybeSingle();

  if (app) return 'participant';

  return 'none';
}

// Returns true if userClearance satisfies the document's clearance_level.
export function canAccessDocument(
  userClearance: UserClearance,
  docClearance: ClearanceLevel,
): boolean {
  const RANK: Record<UserClearance | ClearanceLevel, number> = {
    operator:    4,
    researcher:  3,
    participant: 2,
    public:      1,
    none:        0,
  };
  return RANK[userClearance] >= RANK[docClearance];
}

// Returns true if the user can upload this document type.
// Operator can always upload anything.
// Researcher can upload 'researcher'- or 'both'-uploader docs.
export function canUpload(userClearance: UserClearance, uploaderRole: 'researcher' | 'operator' | 'both'): boolean {
  if (userClearance === 'operator') return true;
  if (userClearance === 'researcher') return uploaderRole === 'researcher' || uploaderRole === 'both';
  return false;
}

// Filters a document list to those visible to the user.
export function filterByAccess(docs: StudyDocument[], userClearance: UserClearance): StudyDocument[] {
  return docs.filter(d => canAccessDocument(userClearance, d.clearance_level));
}
