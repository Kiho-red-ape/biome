// ─── Enums ────────────────────────────────────────────────────────────────────

export type ExperimentStatus = 'draft' | 'recruiting' | 'active' | 'completed' | 'cancelled';
export type ApplicationStatus = 'applied' | 'approved' | 'rejected' | 'waitlisted' | 'completed' | 'withdrawn';
export type PayoutStatus = 'pending' | 'paid' | 'failed';
export type VerificationLevel = 'none' | 'biome' | 'institutional';
export type UserRole = 'experimenter' | 'participant' | 'both';
export type AuthType = 'email' | 'wallet';
export type VerificationStatus = 'pending' | 'email_verified' | 'phone_verified' | 'fully_verified';
export type ScreeningStatus = 'pending' | 'approved' | 'rejected';

// ─── Row types ────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  auth_type: AuthType;
  wallet_address: string | null;
  display_name: string | null;
  bio: string | null;
  role: UserRole;
  region: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Experiment {
  id: string;
  experimenter_id: string;
  title: string;
  short_description: string | null;
  description: string;
  category: string;
  status: ExperimentStatus;
  bounty_per_participant: number;
  total_bounty_pool: number;
  slots_total: number;
  slots_filled: number;
  duration_weeks: number | null;
  region: string | null;
  is_remote: boolean;
  is_verified: boolean;
  verification_level: VerificationLevel;
  external_comms_url: string | null;
  tests_needed: string | null;
  inclusion_criteria: string | null;
  exclusion_criteria: string | null;
  iec_approval: string | null;
  launch_date: string | null;
  amendment_log: AmendmentEntry[];
  created_at: string;
  updated_at: string;
}

export interface AmendmentEntry {
  ts: string;
  field: string;
  old_value: string;
  new_value: string;
  edited_by: string;
}

export interface Application {
  id: string;
  experiment_id: string;
  participant_id: string;
  status: ApplicationStatus;
  applied_at: string;
  approved_at: string | null;
  completed_at: string | null;
  payout_status: PayoutStatus;
}

export interface Comment {
  id: string;
  experiment_id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  upvotes: number;
  created_at: string;
}

export interface ExperimentUpdate {
  id: string;
  experiment_id: string;
  author_id: string;
  title: string;
  content: string;
  created_at: string;
}

// ─── Extended profile types ────────────────────────────────────────────────────

export interface ParticipantProfile {
  id: string;
  user_id: string;
  participant_id: string;       // P-XXXX-XXXX, immutable
  pseudonym: string;            // AdjectiveNoun123, immutable
  email_verified: boolean;
  phone_number: string | null;
  phone_verified: boolean;
  country: string;
  payout_country: string | null;
  payout_currency: string | null;
  verification_status: VerificationStatus;
  // device_fingerprint, duplicate_score, flagged intentionally omitted — internal only
  year_of_birth: number | null;
  sex_assigned_at_birth: 'male' | 'female' | 'intersex' | 'prefer_not_to_say' | null;
  gender_identity: string | null;
  ethnicity: string | null;
  nationality: string | null;
  state_region: string | null;
  urbanicity: 'urban' | 'suburban' | 'rural' | null;
  smartphone_os: 'ios' | 'android' | 'both' | 'none' | null;
  wearable_devices: string[] | null;
  internet_reliability: 'stable' | 'intermittent' | 'limited' | null;
  can_receive_kits: boolean | null;
  sample_comfort: string[] | null;
  language_fluency: string[] | null;
  weekly_availability_hours: number | null;
  previous_study_count: number;
  recent_interventions: string | null;
  washout_sensitive: boolean;
  completion_rate: number | null;
  dropout_count: number;
  no_show_count: number;
  reliability_score: number;    // 0–100, auto-calculated: completion_rate×0.6 + study_depth×0.4
  onboarding_step: number;
  created_at: string;
  updated_at: string;
}

export interface ExperimenterProfile {
  id: string;
  user_id: string;
  org_name: string;
  org_website: string | null;
  org_description: string | null;
  role_title: string | null;
  expertise_areas: string[] | null;
  screening_status: ScreeningStatus;
  screened_at: string | null;
  screened_by: string | null;
  experiments_posted: number;
  verified_experiments: number;
  created_at: string;
  updated_at: string;
}

// ─── Supabase Database type ────────────────────────────────────────────────────
// Must match the shape @supabase/supabase-js expects for its generics.

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'> & { created_at?: string };
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
        Relationships: [];
      };
      experiments: {
        Row: Experiment;
        Insert: Omit<Experiment, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Experiment, 'id' | 'created_at'>>;
        Relationships: [];
      };
      applications: {
        Row: Application;
        Insert: Omit<Application, 'id' | 'applied_at'> & {
          id?: string;
          applied_at?: string;
        };
        Update: Partial<Omit<Application, 'id' | 'applied_at'>>;
        Relationships: [];
      };
      comments: {
        Row: Comment;
        Insert: Omit<Comment, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Comment, 'id' | 'created_at'>>;
        Relationships: [];
      };
      experiment_updates: {
        Row: ExperimentUpdate;
        Insert: Omit<ExperimentUpdate, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ExperimentUpdate, 'id' | 'created_at'>>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
