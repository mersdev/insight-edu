-- Create tables for Insight EDU database

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  dashboard_insight TEXT DEFAULT '',
  last_analyzed TEXT DEFAULT '',
  insight_auto_update_hours INTEGER DEFAULT 12
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('TEACHER', 'HQ', 'PARENT'))
);

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT
);

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  english_name VARCHAR(255),
  chinese_name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  description TEXT
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  teacher_id VARCHAR(50) REFERENCES teachers(id) ON DELETE CASCADE,
  location_id VARCHAR(50) REFERENCES locations(id) ON DELETE SET NULL,
  grade VARCHAR(50) NOT NULL,
  default_schedule JSONB
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id VARCHAR(50),
  class_ids JSONB NOT NULL,
  attendance INTEGER DEFAULT 0,
  at_risk BOOLEAN DEFAULT FALSE,
  school VARCHAR(255),
  parent_name VARCHAR(255),
  relationship VARCHAR(100),
  emergency_contact VARCHAR(50),
  parent_email VARCHAR(255)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(50) PRIMARY KEY,
  class_id VARCHAR(50) REFERENCES classes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('REGULAR', 'SPECIAL')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('SCHEDULED', 'CANCELLED', 'COMPLETED')),
  target_student_ids JSONB
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
  session_id VARCHAR(50) REFERENCES sessions(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT')),
  reason TEXT,
  UNIQUE(student_id, session_id)
);

-- Scores table
CREATE TABLE IF NOT EXISTS scores (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  subject VARCHAR(255) NOT NULL,
  value INTEGER NOT NULL CHECK (value >= 0 AND value <= 100),
  type VARCHAR(50) NOT NULL CHECK (type IN ('EXAM', 'HOMEWORK', 'QUIZ', 'PRESENTATION', 'LAB'))
);

-- Behaviors table
CREATE TABLE IF NOT EXISTS behaviors (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
  session_id VARCHAR(50) REFERENCES sessions(id) ON DELETE CASCADE,
  date TIMESTAMP NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('Attention', 'Participation', 'Homework', 'Behavior', 'Practice')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5)
);

-- Student Insights table
CREATE TABLE IF NOT EXISTS student_insights (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(50) UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  insights JSONB NOT NULL,
  last_analyzed TEXT NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON students(parent_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sessions_class_id ON sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_scores_student_id ON scores(student_id);
CREATE INDEX IF NOT EXISTS idx_behaviors_student_id ON behaviors(student_id);
CREATE INDEX IF NOT EXISTS idx_behaviors_session_id ON behaviors(session_id);

