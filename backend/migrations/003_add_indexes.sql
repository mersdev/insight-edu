-- Migration: Add performance and uniqueness indexes
-- Date: 2025-02-01

CREATE INDEX IF NOT EXISTS idx_sessions_date_time ON sessions(date, start_time);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_class_date_time ON sessions(class_id, date, start_time);

CREATE INDEX IF NOT EXISTS idx_scores_date ON scores(date);
CREATE INDEX IF NOT EXISTS idx_scores_student_date_subject_type ON scores(student_id, date, subject, type);

CREATE INDEX IF NOT EXISTS idx_behaviors_date ON behaviors(date);
CREATE INDEX IF NOT EXISTS idx_behaviors_student_session_category ON behaviors(student_id, session_id, category);
