// Shared types for the BIOME participant agent system.
// One conversational agent, four modes, one evolving participant record.

export type AgentMode = 'onboard' | 'screen' | 'consent' | 'support';

export type ConversationStatus = 'active' | 'complete' | 'flagged_operator' | 'abandoned';

export type VerificationLevel = 'unverified' | 'aware' | 'verified' | 'community_builder';

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
  ts?: string;
}

// Captured once during onboarding, reused for every study match.
export interface ReusableEligibility {
  age_range?: string;
  location?: string;
  general_health_context?: string;
  samples_comfortable_with?: string[];
  conditions_disclosed?: string[];
  interests?: string[];
  languages?: string[];
  devices_owned?: string[];
}

// The structured payload the model returns each turn via the forced `respond` tool.
export interface RespondPayload {
  message: string;                       // participant-facing reply
  extracted: Record<string, unknown>;    // structured fields captured this turn
  flag_operator: boolean;                // escalate to a human
  flag_reason: string | null;
  done: boolean;                         // this mode's goal is complete
}

export interface ConverseResult {
  conversationId: string;
  reply: string;
  extracted: Record<string, unknown>;
  flagged: boolean;
  flagReason: string | null;
  status: ConversationStatus;
  done: boolean;
}

// The slice of the participant record the agent reads each turn.
export interface ParticipantContext {
  participantId: string;
  pseudonym: string | null;
  country: string | null;
  yearOfBirth: number | null;
  verificationLevel: VerificationLevel;
  reusableEligibility: ReusableEligibility;
  languages: string[];
}
