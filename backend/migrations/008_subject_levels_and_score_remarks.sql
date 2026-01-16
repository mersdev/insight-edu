-- Add subject_levels to teachers to support subject-level mappings
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS subject_levels TEXT;

-- Add remark column for per-score tutor comments
ALTER TABLE scores ADD COLUMN IF NOT EXISTS remark TEXT;
