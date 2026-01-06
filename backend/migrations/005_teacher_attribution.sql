-- Add teacher attribution columns to scores and behaviors

ALTER TABLE scores ADD COLUMN teacher_id TEXT REFERENCES teachers(id) ON DELETE SET NULL;
ALTER TABLE behaviors ADD COLUMN teacher_id TEXT REFERENCES teachers(id) ON DELETE SET NULL;

-- Create indexes to help queries by tutor
CREATE INDEX IF NOT EXISTS idx_scores_teacher_id ON scores(teacher_id);
CREATE INDEX IF NOT EXISTS idx_behaviors_teacher_id ON behaviors(teacher_id);
