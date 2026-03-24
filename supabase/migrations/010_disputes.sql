-- Migration 010: Dispute resolution tables
-- 7-day raise window, 3 free per participant then $10 fee

CREATE TABLE IF NOT EXISTS disputes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id   uuid NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  application_id  uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  milestone_id    uuid REFERENCES participant_milestones(id) ON DELETE SET NULL,
  raised_by       text NOT NULL, -- privy DID (participant)
  subject         text NOT NULL,
  description     text NOT NULL,
  status          text NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open', 'under_review', 'resolved_for_participant', 'resolved_for_experimenter', 'closed')),
  resolution_note text,
  resolved_at     timestamptz,
  resolved_by     text,          -- privy DID of admin/experimenter who resolved
  fee_charged     boolean NOT NULL DEFAULT false,
  fee_amount      numeric(10,2) NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dispute_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id  uuid NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  author_id   text NOT NULL,    -- privy DID
  author_role text NOT NULL CHECK (author_role IN ('participant', 'experimenter', 'admin')),
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Track per-participant free dispute usage
CREATE TABLE IF NOT EXISTS dispute_credits (
  participant_id   text PRIMARY KEY, -- privy DID
  free_used        int  NOT NULL DEFAULT 0,
  total_raised     int  NOT NULL DEFAULT 0,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE disputes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_credits  ENABLE ROW LEVEL SECURITY;

-- disputes: participant sees their own; experimenter sees disputes on their experiments
CREATE POLICY "participant_own_disputes" ON disputes
  FOR ALL USING (raised_by = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "experimenter_experiment_disputes" ON disputes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM experiments e
      WHERE e.id = disputes.experiment_id
        AND e.experimenter_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- dispute_messages: accessible if the user has access to the parent dispute
CREATE POLICY "dispute_message_access" ON dispute_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM disputes d
      WHERE d.id = dispute_messages.dispute_id
        AND (
          d.raised_by = current_setting('request.jwt.claims', true)::json->>'sub'
          OR EXISTS (
            SELECT 1 FROM experiments e
            WHERE e.id = d.experiment_id
              AND e.experimenter_id = current_setting('request.jwt.claims', true)::json->>'sub'
          )
        )
    )
  );

-- dispute_credits: self-read only
CREATE POLICY "own_credits" ON dispute_credits
  FOR ALL USING (participant_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- updated_at trigger
CREATE OR REPLACE FUNCTION handle_dispute_updated()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_dispute_updated ON disputes;
CREATE TRIGGER on_dispute_updated
  BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION handle_dispute_updated();
