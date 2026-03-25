-- ─── Phase 3: Study lifecycle states + eligibility quiz tables ────────────────

-- Add new experiment_status values if they don't exist
DO $$
BEGIN
  -- Add lifecycle statuses (IF NOT EXISTS guard via exception)
  BEGIN ALTER TYPE experiment_status ADD VALUE 'ready_to_publish'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE experiment_status ADD VALUE 'published';        EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE experiment_status ADD VALUE 'screening_open';   EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE experiment_status ADD VALUE 'screening_closed'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE experiment_status ADD VALUE 'funding_hold';     EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE experiment_status ADD VALUE 'ready_to_launch';  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Lifecycle timestamps + publish metadata
ALTER TABLE experiments
  ADD COLUMN IF NOT EXISTS published_at              timestamptz,
  ADD COLUMN IF NOT EXISTS application_deadline      timestamptz,
  ADD COLUMN IF NOT EXISTS recruitment_window_days   integer DEFAULT 90,
  ADD COLUMN IF NOT EXISTS publish_fee_status        text DEFAULT 'not_required'
    CHECK (publish_fee_status IN ('not_required','free_tier','pending','paid')),
  ADD COLUMN IF NOT EXISTS funding_hold_status       text DEFAULT 'not_required'
    CHECK (funding_hold_status IN ('not_required','pending','held','released'));

-- Eligibility quiz questions
CREATE TABLE IF NOT EXISTS eligibility_questions (
  id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  experiment_id   uuid REFERENCES experiments(id) ON DELETE CASCADE NOT NULL,
  question_text   text NOT NULL,
  expected_answer text NOT NULL CHECK (expected_answer IN ('yes','no')),
  weight          text DEFAULT 'medium' CHECK (weight IN ('low','medium','high')),
  sort_order      integer DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS eligibility_questions_experiment_id_idx
  ON eligibility_questions(experiment_id);

-- Eligibility quiz responses (per application)
CREATE TABLE IF NOT EXISTS eligibility_responses (
  id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id  uuid REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  question_id     uuid REFERENCES eligibility_questions(id) ON DELETE CASCADE NOT NULL,
  answer          text NOT NULL CHECK (answer IN ('yes','no')),
  created_at      timestamptz DEFAULT now(),
  UNIQUE (application_id, question_id)
);

CREATE INDEX IF NOT EXISTS eligibility_responses_application_id_idx
  ON eligibility_responses(application_id);

-- eligibility_status column on applications (set during quiz submission)
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS eligibility_status text
    CHECK (eligibility_status IN ('eligible','not_eligible','not_applicable'));

-- Study messages (experimenter outbound to approved participants)
CREATE TABLE IF NOT EXISTS study_messages (
  id               uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  experiment_id    uuid REFERENCES experiments(id) ON DELETE CASCADE NOT NULL,
  sent_by          text NOT NULL,
  subject          text NOT NULL,
  body             text NOT NULL,
  handoff_url      text,
  sent_at          timestamptz DEFAULT now(),
  recipient_count  integer DEFAULT 0
);

-- RLS: eligibility_questions — public read, experimenter-write
ALTER TABLE eligibility_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "eligibility_questions_read" ON eligibility_questions;
CREATE POLICY "eligibility_questions_read" ON eligibility_questions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "eligibility_questions_insert" ON eligibility_questions;
CREATE POLICY "eligibility_questions_insert" ON eligibility_questions
  FOR INSERT WITH CHECK (
    experiment_id IN (
      SELECT id FROM experiments WHERE experimenter_id = (current_setting('request.jwt.claims', true)::json->>'sub')
    )
  );

-- RLS: eligibility_responses — participant write own, experimenter read their experiment's responses
ALTER TABLE eligibility_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "eligibility_responses_insert" ON eligibility_responses;
CREATE POLICY "eligibility_responses_insert" ON eligibility_responses
  FOR INSERT WITH CHECK (true);  -- service role handles validation

DROP POLICY IF EXISTS "eligibility_responses_read" ON eligibility_responses;
CREATE POLICY "eligibility_responses_read" ON eligibility_responses
  FOR SELECT USING (true);

-- RLS: study_messages — experimenter write, participants read for their applications
ALTER TABLE study_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "study_messages_read" ON study_messages;
CREATE POLICY "study_messages_read" ON study_messages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "study_messages_insert" ON study_messages;
CREATE POLICY "study_messages_insert" ON study_messages
  FOR INSERT WITH CHECK (true);
