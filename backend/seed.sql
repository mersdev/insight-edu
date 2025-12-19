-- Comprehensive Seed Data for Insight EDU
-- Includes base data and December 2025 sessions with attendance and behavior ratings

-- Insert settings
INSERT INTO settings (dashboard_insight, last_analyzed) VALUES ('', '');

-- Insert users with hashed passwords
-- Note: password_hash, must_change_password, and last_password_change columns are added by migration 001_add_password_columns.sql
INSERT INTO users (id, name, email, password, password_hash, role, must_change_password) VALUES
('admin', 'HQ Admin', 'admin@edu.com', 'Admin123', '$2b$10$GOKlaLMUnNiR61MXBJ9IDeEAmlrSutGsAalNcxiyD/cmuBn84WxqO', 'HQ', true),
('u_t1', 'Sarah Jenkins', 'sarah@edu.com', '123', '$2b$10$Xi559l/1aqbWBsrEXCDCT.4VBm4Zq2DQb5PsstrFxGJT4d3CIyVly', 'TEACHER', true),
('u_t2', 'David Lee', 'david@edu.com', '123', '$2b$10$Jj2b9BAsRLXEm89VkUjFruQwDDWwToVN.IQsR.Xmyk5uN177SEE..', 'TEACHER', true),
('u_p1', 'Mr. Ahmad', 'parent.ali@edu.com', '123', '$2b$10$WXX7u28qMRPI8hnjwdHySuIpw6xKJW6nyTFcSwOE0M6w5NJFCfufG', 'PARENT', true),
('u_p2', 'Mrs. Wong', 'parent.ben@edu.com', '123', '$2b$10$S6sU8Ii1VeZ00DudBO1/F.wG2VFYkaZW/7LezY5UYHaAaI7s44ihK', 'PARENT', true),
('u_p3', 'Ms. Davis', 'parent.charlie@edu.com', '123', '$2b$10$dcbONp5ShVGTrMsKzjN/u.4qawazd0oqzdsepVAAGY1XXJBMmqA/G', 'PARENT', true),
('u_p4', 'Ms. Goh', 'parent.goh@edu.com', '123', '$2b$10$S6sU8Ii1VeZ00DudBO1/F.wG2VFYkaZW/7LezY5UYHaAaI7s44ihK', 'PARENT', true);

-- Insert locations
INSERT INTO locations (id, name, address) VALUES
('l1', 'Cheras', 'Jalan Cerdas, Taman Connaught'),
('l2', 'Petaling Jaya', 'Jalan Yong Shook Lin, PJ New Town'),
('l3', 'Subang Jaya', 'Jalan SS 15/8'),
('l4', 'Kuala Lumpur', 'Jalan Ampang');

-- Insert teachers
INSERT INTO teachers (id, name, english_name, chinese_name, email, subject, phone, description) VALUES
('t1', 'Sarah Jenkins', 'Sarah', '-', 'sarah@edu.com', 'Mathematics', '012-345 6789', 'Head of Mathematics Department.'),
('t2', 'David Lee', 'David', '李', 'david@edu.com', 'Science', '016-789 0123', 'Science and Physics Teacher.');

-- Insert classes
INSERT INTO classes (id, name, teacher_id, location_id, grade, default_schedule) VALUES
('c1', 'Grade 10 Mathematics A', 't1', 'l1', '10', '{"dayOfWeek": "Monday", "time": "09:00"}'),
('c2', 'Grade 10 Science B', 't2', 'l2', '10', '{"dayOfWeek": "Wednesday", "time": "11:00"}');

-- Insert students
INSERT INTO students (id, name, parent_id, class_ids, attendance, at_risk, school, parent_name, relationship, emergency_contact, parent_email) VALUES
('s1', 'Ali Ahmad', 'u_p1', '["c1", "c2"]', 95, false, 'City High School', 'Mr. Ahmad', 'Father', '012-111 2222', 'parent.ali@edu.com'),
('s2', 'Ben Wong', 'u_p2', '["c1"]', 88, false, 'Valley International', 'Mrs. Wong', 'Mother', '013-333 4444', 'parent.ben@edu.com'),
('s3', 'Charlie Davis', 'u_p3', '["c2"]', 65, true, 'North Academy', 'Ms. Davis', 'Mother', '019-555 6666', 'parent.charlie@edu.com'),
('s4', 'Goh Shu Ting', 'u_p4', '["c1", "c2"]', 92, false, 'International School', 'Ms. Goh', 'Mother', '014-777 8888', 'parent.goh@edu.com');

-- Insert sessions for class c1
INSERT INTO sessions (id, class_id, date, start_time, type, status) VALUES
('ses_c1_1', 'c1', '2025-10-07', '09:00', 'REGULAR', 'COMPLETED'),
('ses_c1_2', 'c1', '2025-10-14', '09:00', 'REGULAR', 'COMPLETED'),
('ses_c1_3', 'c1', '2025-10-21', '09:00', 'REGULAR', 'COMPLETED'),
('ses_c1_4', 'c1', '2025-10-28', '09:00', 'REGULAR', 'COMPLETED'),
('ses_c1_5', 'c1', '2025-11-04', '09:00', 'REGULAR', 'COMPLETED'),
('ses_c1_6', 'c1', '2025-11-11', '09:00', 'REGULAR', 'COMPLETED'),
('ses_c1_7', 'c1', '2025-11-18', '09:00', 'REGULAR', 'COMPLETED'),
('ses_c1_8', 'c1', '2025-11-25', '09:00', 'REGULAR', 'COMPLETED'),
('ses_c1_9', 'c1', '2025-12-02', '09:00', 'REGULAR', 'COMPLETED'),
('ses_c1_10', 'c1', '2025-12-09', '09:00', 'REGULAR', 'COMPLETED'),
('ses_c1_11', 'c1', '2025-12-16', '09:00', 'REGULAR', 'COMPLETED'),
('ses_c1_12', 'c1', '2025-12-23', '09:00', 'REGULAR', 'COMPLETED'),
('ses_c1_13', 'c1', '2025-12-30', '09:00', 'REGULAR', 'COMPLETED');

-- Insert sessions for class c2
INSERT INTO sessions (id, class_id, date, start_time, type, status) VALUES
('ses_c2_1', 'c2', '2025-10-02', '11:00', 'REGULAR', 'COMPLETED'),
('ses_c2_2', 'c2', '2025-10-09', '11:00', 'REGULAR', 'COMPLETED'),
('ses_c2_3', 'c2', '2025-10-16', '11:00', 'REGULAR', 'COMPLETED'),
('ses_c2_4', 'c2', '2025-10-23', '11:00', 'REGULAR', 'COMPLETED'),
('ses_c2_5', 'c2', '2025-10-30', '11:00', 'REGULAR', 'COMPLETED'),
('ses_c2_6', 'c2', '2025-11-06', '11:00', 'REGULAR', 'COMPLETED'),
('ses_c2_7', 'c2', '2025-11-13', '11:00', 'REGULAR', 'COMPLETED'),
('ses_c2_8', 'c2', '2025-11-20', '11:00', 'REGULAR', 'COMPLETED'),
('ses_c2_9', 'c2', '2025-11-27', '11:00', 'REGULAR', 'COMPLETED'),
('ses_c2_10', 'c2', '2025-12-04', '11:00', 'REGULAR', 'COMPLETED'),
('ses_c2_11', 'c2', '2025-12-11', '11:00', 'REGULAR', 'COMPLETED'),
('ses_c2_12', 'c2', '2025-12-18', '11:00', 'REGULAR', 'COMPLETED'),
('ses_c2_13', 'c2', '2025-12-25', '11:00', 'REGULAR', 'CANCELLED');

-- Insert scores
INSERT INTO scores (student_id, date, subject, value, type) VALUES
('s1', '2025-10-15', 'Math', 85, 'EXAM'),
('s2', '2025-10-15', 'Math', 78, 'EXAM'),
('s3', '2025-10-16', 'Science', 45, 'EXAM'),
('s1', '2025-11-20', 'Math', 88, 'EXAM'),
('s2', '2025-11-20', 'Math', 82, 'EXAM'),
('s3', '2025-11-20', 'Science', 50, 'EXAM'),
('s1', '2025-12-15', 'Math', 92, 'EXAM'),
('s2', '2025-12-15', 'Math', 85, 'EXAM'),
('s3', '2025-12-15', 'Science', 48, 'EXAM');

-- ============================================================================
-- ATTENDANCE RECORDS FOR DECEMBER 2025
-- ============================================================================

-- Class c1 (Mathematics) December Sessions
-- Ali Ahmad (s1) - enrolled in c1 and c2
-- Ben Wong (s2) - enrolled in c1 only
-- Goh Shu Ting (s4) - enrolled in c1 and c2

-- ses_c1_9: 2025-12-02 (Monday)
INSERT INTO attendance (id, student_id, session_id, status, reason) VALUES
('att_c1_9_s1', 's1', 'ses_c1_9', 'PRESENT', NULL),
('att_c1_9_s2', 's2', 'ses_c1_9', 'PRESENT', NULL),
('att_c1_9_s4', 's4', 'ses_c1_9', 'PRESENT', NULL)
ON CONFLICT (student_id, session_id) DO NOTHING;

-- ses_c1_10: 2025-12-09 (Monday)
INSERT INTO attendance (id, student_id, session_id, status, reason) VALUES
('att_c1_10_s1', 's1', 'ses_c1_10', 'PRESENT', NULL),
('att_c1_10_s2', 's2', 'ses_c1_10', 'ABSENT', 'Medical leave - flu'),
('att_c1_10_s4', 's4', 'ses_c1_10', 'PRESENT', NULL)
ON CONFLICT (student_id, session_id) DO NOTHING;

-- ses_c1_11: 2025-12-16 (Monday)
INSERT INTO attendance (id, student_id, session_id, status, reason) VALUES
('att_c1_11_s1', 's1', 'ses_c1_11', 'PRESENT', NULL),
('att_c1_11_s2', 's2', 'ses_c1_11', 'PRESENT', NULL),
('att_c1_11_s4', 's4', 'ses_c1_11', 'ABSENT', 'Family emergency')
ON CONFLICT (student_id, session_id) DO NOTHING;

-- ses_c1_12: 2025-12-23 (Monday)
INSERT INTO attendance (id, student_id, session_id, status, reason) VALUES
('att_c1_12_s1', 's1', 'ses_c1_12', 'PRESENT', NULL),
('att_c1_12_s2', 's2', 'ses_c1_12', 'PRESENT', NULL),
('att_c1_12_s4', 's4', 'ses_c1_12', 'PRESENT', NULL)
ON CONFLICT (student_id, session_id) DO NOTHING;

-- ses_c1_13: 2025-12-30 (Monday)
INSERT INTO attendance (id, student_id, session_id, status, reason) VALUES
('att_c1_13_s1', 's1', 'ses_c1_13', 'ABSENT', 'Personal leave - family vacation'),
('att_c1_13_s2', 's2', 'ses_c1_13', 'PRESENT', NULL),
('att_c1_13_s4', 's4', 'ses_c1_13', 'PRESENT', NULL)
ON CONFLICT (student_id, session_id) DO NOTHING;

-- Class c2 (Science) December Sessions
-- Ali Ahmad (s1) - enrolled in c1 and c2
-- Goh Shu Ting (s4) - enrolled in c1 and c2

-- ses_c2_10: 2025-12-04 (Wednesday)
INSERT INTO attendance (id, student_id, session_id, status, reason) VALUES
('att_c2_10_s1', 's1', 'ses_c2_10', 'PRESENT', NULL),
('att_c2_10_s4', 's4', 'ses_c2_10', 'PRESENT', NULL)
ON CONFLICT (student_id, session_id) DO NOTHING;

-- ses_c2_11: 2025-12-11 (Wednesday)
INSERT INTO attendance (id, student_id, session_id, status, reason) VALUES
('att_c2_11_s1', 's1', 'ses_c2_11', 'PRESENT', NULL),
('att_c2_11_s4', 's4', 'ses_c2_11', 'PRESENT', NULL)
ON CONFLICT (student_id, session_id) DO NOTHING;

-- ses_c2_12: 2025-12-18 (Wednesday)
INSERT INTO attendance (id, student_id, session_id, status, reason) VALUES
('att_c2_12_s1', 's1', 'ses_c2_12', 'PRESENT', NULL),
('att_c2_12_s4', 's4', 'ses_c2_12', 'ABSENT', 'Medical appointment')
ON CONFLICT (student_id, session_id) DO NOTHING;

-- ses_c2_13: 2025-12-25 (Wednesday) - CANCELLED SESSION
-- No attendance records for cancelled sessions


-- ============================================================================
-- BEHAVIOR RATINGS (Session Ratings) FOR DECEMBER 2025
-- Categories: Attention, Participation, Homework, Behavior, Practice
-- Rating scale: 1-5 (1=Poor, 5=Excellent)
-- Only for sessions where students were PRESENT
-- ============================================================================

-- Class c1 Session 9 (2025-12-02) - Ali Ahmad, Ben Wong, Goh Shu Ting present
INSERT INTO behaviors (student_id, session_id, date, category, rating) VALUES
-- Ali Ahmad ratings
('s1', 'ses_c1_9', '2025-12-02 09:00:00', 'Attention', 5),
('s1', 'ses_c1_9', '2025-12-02 09:00:00', 'Participation', 5),
('s1', 'ses_c1_9', '2025-12-02 09:00:00', 'Homework', 5),
('s1', 'ses_c1_9', '2025-12-02 09:00:00', 'Behavior', 5),
('s1', 'ses_c1_9', '2025-12-02 09:00:00', 'Practice', 4),
-- Ben Wong ratings
('s2', 'ses_c1_9', '2025-12-02 09:00:00', 'Attention', 4),
('s2', 'ses_c1_9', '2025-12-02 09:00:00', 'Participation', 4),
('s2', 'ses_c1_9', '2025-12-02 09:00:00', 'Homework', 4),
('s2', 'ses_c1_9', '2025-12-02 09:00:00', 'Behavior', 5),
('s2', 'ses_c1_9', '2025-12-02 09:00:00', 'Practice', 4),
-- Goh Shu Ting ratings
('s4', 'ses_c1_9', '2025-12-02 09:00:00', 'Attention', 5),
('s4', 'ses_c1_9', '2025-12-02 09:00:00', 'Participation', 4),
('s4', 'ses_c1_9', '2025-12-02 09:00:00', 'Homework', 5),
('s4', 'ses_c1_9', '2025-12-02 09:00:00', 'Behavior', 5),
('s4', 'ses_c1_9', '2025-12-02 09:00:00', 'Practice', 5);

-- Class c1 Session 10 (2025-12-09) - Ali Ahmad, Goh Shu Ting present (Ben Wong absent)
INSERT INTO behaviors (student_id, session_id, date, category, rating) VALUES
-- Ali Ahmad ratings
('s1', 'ses_c1_10', '2025-12-09 09:00:00', 'Attention', 4),
('s1', 'ses_c1_10', '2025-12-09 09:00:00', 'Participation', 5),
('s1', 'ses_c1_10', '2025-12-09 09:00:00', 'Homework', 5),
('s1', 'ses_c1_10', '2025-12-09 09:00:00', 'Behavior', 5),
('s1', 'ses_c1_10', '2025-12-09 09:00:00', 'Practice', 5),
-- Goh Shu Ting ratings
('s4', 'ses_c1_10', '2025-12-09 09:00:00', 'Attention', 4),
('s4', 'ses_c1_10', '2025-12-09 09:00:00', 'Participation', 4),
('s4', 'ses_c1_10', '2025-12-09 09:00:00', 'Homework', 5),
('s4', 'ses_c1_10', '2025-12-09 09:00:00', 'Behavior', 5),
('s4', 'ses_c1_10', '2025-12-09 09:00:00', 'Practice', 4);

-- Class c1 Session 11 (2025-12-16) - Ali Ahmad, Ben Wong present (Goh Shu Ting absent)
INSERT INTO behaviors (student_id, session_id, date, category, rating) VALUES
-- Ali Ahmad ratings
('s1', 'ses_c1_11', '2025-12-16 09:00:00', 'Attention', 5),
('s1', 'ses_c1_11', '2025-12-16 09:00:00', 'Participation', 5),
('s1', 'ses_c1_11', '2025-12-16 09:00:00', 'Homework', 4),
('s1', 'ses_c1_11', '2025-12-16 09:00:00', 'Behavior', 5),
('s1', 'ses_c1_11', '2025-12-16 09:00:00', 'Practice', 5),
-- Ben Wong ratings
('s2', 'ses_c1_11', '2025-12-16 09:00:00', 'Attention', 4),
('s2', 'ses_c1_11', '2025-12-16 09:00:00', 'Participation', 3),
('s2', 'ses_c1_11', '2025-12-16 09:00:00', 'Homework', 4),
('s2', 'ses_c1_11', '2025-12-16 09:00:00', 'Behavior', 4),
('s2', 'ses_c1_11', '2025-12-16 09:00:00', 'Practice', 4);

-- Class c1 Session 12 (2025-12-23) - All three present
INSERT INTO behaviors (student_id, session_id, date, category, rating) VALUES
-- Ali Ahmad ratings
('s1', 'ses_c1_12', '2025-12-23 09:00:00', 'Attention', 5),
('s1', 'ses_c1_12', '2025-12-23 09:00:00', 'Participation', 5),
('s1', 'ses_c1_12', '2025-12-23 09:00:00', 'Homework', 5),
('s1', 'ses_c1_12', '2025-12-23 09:00:00', 'Behavior', 5),
('s1', 'ses_c1_12', '2025-12-23 09:00:00', 'Practice', 5),
-- Ben Wong ratings
('s2', 'ses_c1_12', '2025-12-23 09:00:00', 'Attention', 4),
('s2', 'ses_c1_12', '2025-12-23 09:00:00', 'Participation', 4),
('s2', 'ses_c1_12', '2025-12-23 09:00:00', 'Homework', 5),
('s2', 'ses_c1_12', '2025-12-23 09:00:00', 'Behavior', 5),
('s2', 'ses_c1_12', '2025-12-23 09:00:00', 'Practice', 4),
-- Goh Shu Ting ratings
('s4', 'ses_c1_12', '2025-12-23 09:00:00', 'Attention', 5),
('s4', 'ses_c1_12', '2025-12-23 09:00:00', 'Participation', 5),
('s4', 'ses_c1_12', '2025-12-23 09:00:00', 'Homework', 5),
('s4', 'ses_c1_12', '2025-12-23 09:00:00', 'Behavior', 5),
('s4', 'ses_c1_12', '2025-12-23 09:00:00', 'Practice', 5);

-- Class c1 Session 13 (2025-12-30) - Ben Wong, Goh Shu Ting present (Ali Ahmad absent)
INSERT INTO behaviors (student_id, session_id, date, category, rating) VALUES
-- Ben Wong ratings
('s2', 'ses_c1_13', '2025-12-30 09:00:00', 'Attention', 4),
('s2', 'ses_c1_13', '2025-12-30 09:00:00', 'Participation', 4),
('s2', 'ses_c1_13', '2025-12-30 09:00:00', 'Homework', 4),
('s2', 'ses_c1_13', '2025-12-30 09:00:00', 'Behavior', 5),
('s2', 'ses_c1_13', '2025-12-30 09:00:00', 'Practice', 4),
-- Goh Shu Ting ratings
('s4', 'ses_c1_13', '2025-12-30 09:00:00', 'Attention', 5),
('s4', 'ses_c1_13', '2025-12-30 09:00:00', 'Participation', 4),
('s4', 'ses_c1_13', '2025-12-30 09:00:00', 'Homework', 5),
('s4', 'ses_c1_13', '2025-12-30 09:00:00', 'Behavior', 5),
('s4', 'ses_c1_13', '2025-12-30 09:00:00', 'Practice', 5);

-- Class c2 Session 10 (2025-12-04) - Ali Ahmad, Goh Shu Ting present
INSERT INTO behaviors (student_id, session_id, date, category, rating) VALUES
-- Ali Ahmad ratings
('s1', 'ses_c2_10', '2025-12-04 11:00:00', 'Attention', 5),
('s1', 'ses_c2_10', '2025-12-04 11:00:00', 'Participation', 5),
('s1', 'ses_c2_10', '2025-12-04 11:00:00', 'Homework', 5),
('s1', 'ses_c2_10', '2025-12-04 11:00:00', 'Behavior', 5),
('s1', 'ses_c2_10', '2025-12-04 11:00:00', 'Practice', 4),
-- Goh Shu Ting ratings
('s4', 'ses_c2_10', '2025-12-04 11:00:00', 'Attention', 4),
('s4', 'ses_c2_10', '2025-12-04 11:00:00', 'Participation', 5),
('s4', 'ses_c2_10', '2025-12-04 11:00:00', 'Homework', 5),
('s4', 'ses_c2_10', '2025-12-04 11:00:00', 'Behavior', 5),
('s4', 'ses_c2_10', '2025-12-04 11:00:00', 'Practice', 5);

-- Class c2 Session 11 (2025-12-11) - Ali Ahmad, Goh Shu Ting present
INSERT INTO behaviors (student_id, session_id, date, category, rating) VALUES
-- Ali Ahmad ratings
('s1', 'ses_c2_11', '2025-12-11 11:00:00', 'Attention', 5),
('s1', 'ses_c2_11', '2025-12-11 11:00:00', 'Participation', 4),
('s1', 'ses_c2_11', '2025-12-11 11:00:00', 'Homework', 5),
('s1', 'ses_c2_11', '2025-12-11 11:00:00', 'Behavior', 5),
('s1', 'ses_c2_11', '2025-12-11 11:00:00', 'Practice', 5),
-- Goh Shu Ting ratings
('s4', 'ses_c2_11', '2025-12-11 11:00:00', 'Attention', 5),
('s4', 'ses_c2_11', '2025-12-11 11:00:00', 'Participation', 5),
('s4', 'ses_c2_11', '2025-12-11 11:00:00', 'Homework', 5),
('s4', 'ses_c2_11', '2025-12-11 11:00:00', 'Behavior', 5),
('s4', 'ses_c2_11', '2025-12-11 11:00:00', 'Practice', 4);

-- Class c2 Session 12 (2025-12-18) - Ali Ahmad present (Goh Shu Ting absent)
INSERT INTO behaviors (student_id, session_id, date, category, rating) VALUES
-- Ali Ahmad ratings
('s1', 'ses_c2_12', '2025-12-18 11:00:00', 'Attention', 5),
('s1', 'ses_c2_12', '2025-12-18 11:00:00', 'Participation', 5),
('s1', 'ses_c2_12', '2025-12-18 11:00:00', 'Homework', 5),
('s1', 'ses_c2_12', '2025-12-18 11:00:00', 'Behavior', 5),
('s1', 'ses_c2_12', '2025-12-18 11:00:00', 'Practice', 5);

-- Session c2_13 (2025-12-25) was CANCELLED - no behavior ratings
