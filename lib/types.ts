// ─── Enums ────────────────────────────────────────────────────────────────────

export type ExperimentStatus = 'draft' | 'recruiting' | 'active' | 'completed' | 'cancelled';
export type ApplicationStatus = 'applied' | 'approved' | 'rejected' | 'completed' | 'withdrawn';
export type PayoutStatus = 'pending' | 'paid' | 'failed';
export type VerificationLevel = 'none' | 'biome' | 'institutional';
export type UserRole = 'experimenter' | 'participant' | 'both';
export type AuthType = 'email' | 'wallet';

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
  created_at: string;
  updated_at: string;
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
