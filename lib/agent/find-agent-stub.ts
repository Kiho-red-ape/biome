// STAGE 0 — FIND & CONVERT (reserved interface; not built in v1)
//
// Specified now so the participant spine is complete and the find agent slots in
// later without rework. When a study is live, the find agent will:
//   1. take the study's eligibility criteria,
//   2. map where matching humans gather across the live web (communities, forums,
//      advocacy groups, creators, regional spaces),
//   3. score each surface for fit / size / accessibility / trust,
//   4. output a ranked warm-outreach map, and
//   5. drive matched people into Stage 1 via referral-tracked links.
//
// It writes into the SAME spine: agent_conversations + participant_profiles. It is
// the future front door to the existing pipe, not a separate system. Attribution
// already works today via participant_profiles.source_channel.

export type SourceChannel =
  | 'organic'
  | 'referral'
  | `find_agent:${string}`;   // find_agent:<community_id> (Stage 0)

export function isFindAgentChannel(channel: string): boolean {
  return channel.startsWith('find_agent:');
}

export function findAgentCommunityId(channel: string): string | null {
  return isFindAgentChannel(channel) ? channel.slice('find_agent:'.length) : null;
}

// Reserved shape the future find agent will emit per discovered surface.
export interface OutreachTarget {
  communityId: string;       // stable id for the gathering place
  name: string;
  kind: 'forum' | 'community' | 'advocacy' | 'creator' | 'regional' | 'other';
  fitScore: number;          // 0..1 — match to study eligibility
  sizeEstimate: number | null;
  accessibility: 'open' | 'gated' | 'restricted';
  trust: 'high' | 'medium' | 'low';
  rationale: string;
  trackedLink: string;       // referral-tracked signup link → Stage 1
}

// Intentionally no implementation in v1.
export const STAGE_0_ENABLED = false;
