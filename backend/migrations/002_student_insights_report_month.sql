-- Add report month key to student_insights for per-month storage
ALTER TABLE student_insights ADD COLUMN report_month_key TEXT NOT NULL DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_student_insights_student_month
ON student_insights(student_id, report_month_key);
