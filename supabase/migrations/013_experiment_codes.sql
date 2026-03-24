-- Migration 013: Experiment codes + task summary
ALTER TABLE experiments
  ADD COLUMN IF NOT EXISTS experiment_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS task_summary text;

-- Auto-assign codes to existing experiments in created_at order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM experiments
  WHERE experiment_code IS NULL
)
UPDATE experiments e
SET experiment_code = 'EXP-' || LPAD(n.rn::text, 4, '0')
FROM numbered n
WHERE e.id = n.id;

-- Function to auto-assign experiment_code on insert
CREATE OR REPLACE FUNCTION assign_experiment_code()
RETURNS TRIGGER AS $$
DECLARE
  next_num integer;
BEGIN
  IF NEW.experiment_code IS NULL THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(experiment_code FROM 5) AS integer)), 0) + 1
    INTO next_num
    FROM experiments
    WHERE experiment_code IS NOT NULL;
    NEW.experiment_code := 'EXP-' || LPAD(next_num::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_experiment_code ON experiments;
CREATE TRIGGER trg_experiment_code
  BEFORE INSERT ON experiments
  FOR EACH ROW EXECUTE FUNCTION assign_experiment_code();
