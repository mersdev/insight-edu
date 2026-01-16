-- Create tables for Insight EDU database (D1 SQLite compatible)
PRAGMA foreign_keys = ON;

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dashboard_insight TEXT DEFAULT '',
  last_analyzed TEXT DEFAULT '',
  insight_auto_update_hours INTEGER DEFAULT 12
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  password_hash TEXT,
  role TEXT NOT NULL CHECK (role IN ('TEACHER', 'HQ', 'PARENT')),
  must_change_password INTEGER DEFAULT 0,
  last_password_change TIMESTAMP
);

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  english_name TEXT,
  chinese_name TEXT,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  subjects TEXT DEFAULT '[]',
  subject_levels TEXT,
  levels TEXT DEFAULT '[]',
  phone TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id TEXT REFERENCES teachers(id) ON DELETE CASCADE,
  grade TEXT NOT NULL,
  default_schedule TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT,
  class_ids TEXT NOT NULL,
  attendance INTEGER DEFAULT 0,
  at_risk INTEGER DEFAULT 0,
  school TEXT,
  parent_name TEXT,
  relationship TEXT,
  emergency_contact TEXT,
  parent_email TEXT,
  address TEXT
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  type TEXT NOT NULL CHECK (type IN ('REGULAR', 'SPECIAL')),
  status TEXT NOT NULL CHECK (status IN ('SCHEDULED', 'CANCELLED', 'COMPLETED')),
  target_student_ids TEXT
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT')),
  reason TEXT,
  UNIQUE(student_id, session_id)
);

-- Scores table
CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  subject TEXT NOT NULL,
  value INTEGER NOT NULL CHECK (value >= 0 AND value <= 100),
  teacher_id TEXT REFERENCES teachers(id) ON DELETE SET NULL,
  remark TEXT,
  type TEXT NOT NULL CHECK (type IN ('EXAM', 'HOMEWORK', 'QUIZ', 'PRESENTATION', 'LAB'))
);

-- Behaviors table
CREATE TABLE IF NOT EXISTS behaviors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  date TIMESTAMP NOT NULL,
  category TEXT NOT NULL,
  teacher_id TEXT REFERENCES teachers(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5)
);

-- Rating Categories table
CREATE TABLE IF NOT EXISTS rating_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Student Insights table
CREATE TABLE IF NOT EXISTS student_insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  insights TEXT NOT NULL,
  last_analyzed TEXT NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON students(parent_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sessions_class_id ON sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date_time ON sessions(date, start_time);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_class_date_time ON sessions(class_id, date, start_time);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_scores_student_id ON scores(student_id);
CREATE INDEX IF NOT EXISTS idx_scores_date ON scores(date);
CREATE INDEX IF NOT EXISTS idx_scores_student_date_subject_type ON scores(student_id, date, subject, type);
CREATE INDEX IF NOT EXISTS idx_behaviors_student_id ON behaviors(student_id);
CREATE INDEX IF NOT EXISTS idx_behaviors_session_id ON behaviors(session_id);
CREATE INDEX IF NOT EXISTS idx_behaviors_date ON behaviors(date);
CREATE INDEX IF NOT EXISTS idx_behaviors_student_session_category ON behaviors(student_id, session_id, category);
CREATE INDEX IF NOT EXISTS idx_scores_teacher_id ON scores(teacher_id);
CREATE INDEX IF NOT EXISTS idx_behaviors_teacher_id ON behaviors(teacher_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
