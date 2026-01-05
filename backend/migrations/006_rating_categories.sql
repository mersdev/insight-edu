-- Migration 006: Add rating categories table and allow dynamic category values
PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

-- Create rating categories table
CREATE TABLE IF NOT EXISTS rating_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed default categories (only new installs; existing data unaffected by INSERT OR IGNORE)
INSERT OR IGNORE INTO rating_categories (id, name, description) VALUES
  (1, 'Attention', 'Focus and concentration'),
  (2, 'Participation', 'Level of engagement in class'),
  (3, 'Homework', 'Homework completeness and quality'),
  (4, 'Behavior', 'General conduct and attitude'),
  (5, 'Practice', 'Practice and revision habits');

-- Create temporary table without CHECK constraint to allow dynamic category labels
CREATE TABLE IF NOT EXISTS behaviors_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  date TIMESTAMP NOT NULL,
  category TEXT NOT NULL,
  teacher_id TEXT REFERENCES teachers(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5)
);

INSERT INTO behaviors_new (id, student_id, session_id, date, category, teacher_id, rating)
SELECT id, student_id, session_id, date, category, teacher_id, rating FROM behaviors;

DROP TABLE behaviors;
ALTER TABLE behaviors_new RENAME TO behaviors;

-- Recreate indexes for behaviors table
CREATE INDEX IF NOT EXISTS idx_behaviors_student_id ON behaviors(student_id);
CREATE INDEX IF NOT EXISTS idx_behaviors_session_id ON behaviors(session_id);
CREATE INDEX IF NOT EXISTS idx_behaviors_date ON behaviors(date);
CREATE INDEX IF NOT EXISTS idx_behaviors_student_session_category ON behaviors(student_id, session_id, category);
CREATE INDEX IF NOT EXISTS idx_behaviors_teacher_id ON behaviors(teacher_id);

COMMIT;
PRAGMA foreign_keys = ON;
