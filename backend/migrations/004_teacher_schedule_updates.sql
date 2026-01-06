-- Add subjects, levels, and session duration enhancements

ALTER TABLE teachers ADD COLUMN subjects TEXT DEFAULT '[]';
ALTER TABLE teachers ADD COLUMN levels TEXT DEFAULT '[]';

ALTER TABLE sessions ADD COLUMN duration_minutes INTEGER DEFAULT 60;

-- Backfill existing teacher data with primary subject if available
UPDATE teachers
SET subjects = json_array(subject)
WHERE subjects IS NULL OR subjects = '[]';

UPDATE teachers
SET levels = '[]'
WHERE levels IS NULL;

UPDATE sessions
SET duration_minutes = 60
WHERE duration_minutes IS NULL;
