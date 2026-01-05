-- Comprehensive Seed Data for Insight EDU
-- Includes base data and December 2025 sessions with attendance and behavior ratings

-- Insert settings
INSERT INTO settings (dashboard_insight, last_analyzed) VALUES ('', '');

-- Insert users with hashed passwords
-- Note: password_hash, must_change_password, and last_password_change columns are added by migration 001_add_password_columns.sql
INSERT INTO users (id, name, email, password, password_hash, role, must_change_password) VALUES
('admin', 'HQ Admin', 'admin@edu.com', 'Admin123', '$2b$10$GOKlaLMUnNiR61MXBJ9IDeEAmlrSutGsAalNcxiyD/cmuBn84WxqO', 'HQ', false),
('t1', 'Sarah Jenkins', 'sarahjenkins@edu.com', '123', '$2b$10$Xi559l/1aqbWBsrEXCDCT.4VBm4Zq2DQb5PsstrFxGJT4d3CIyVly', 'TEACHER', false),
('t2', 'David Lee', 'davidlee@edu.com', '123', '$2b$10$Jj2b9BAsRLXEm89VkUjFruQwDDWwToVN.IQsR.Xmyk5uN177SEE..', 'TEACHER', false),
('t3', 'Elena Tan', 'elenatan@edu.com', '123', '$2b$10$Xi559l/1aqbWBsrEXCDCT.4VBm4Zq2DQb5PsstrFxGJT4d3CIyVly', 'TEACHER', false),
('u_p1', 'Mr. Ahmad', 'ahmad@edu.com', '123', '$2b$10$WXX7u28qMRPI8hnjwdHySuIpw6xKJW6nyTFcSwOE0M6w5NJFCfufG', 'PARENT', false),
('u_p2', 'Mrs. Wong', 'benwong@edu.com', '123', '$2b$10$S6sU8Ii1VeZ00DudBO1/F.wG2VFYkaZW/7LezY5UYHaAaI7s44ihK', 'PARENT', false),
('u_p3', 'Ms. Davis', 'charliedavis@edu.com', '123', '$2b$10$dcbONp5ShVGTrMsKzjN/u.4qawazd0oqzdsepVAAGY1XXJBMmqA/G', 'PARENT', true),
('u_p4', 'Ms. Goh', 'gohshuting@edu.com', '123', '$2b$10$S6sU8Ii1VeZ00DudBO1/F.wG2VFYkaZW/7LezY5UYHaAaI7s44ihK', 'PARENT', true);

-- Insert locations
INSERT INTO locations (id, name, address) VALUES
('l1', 'Cheras', 'Jalan Cerdas, Taman Connaught'),
('l2', 'Petaling Jaya', 'Jalan Yong Shook Lin, PJ New Town'),
('l3', 'Subang Jaya', 'Jalan SS 15/8'),
('l4', 'Kuala Lumpur', 'Jalan Ampang');

-- Insert teachers
INSERT INTO teachers (id, name, english_name, chinese_name, email, subject, subjects, levels, phone, description) VALUES
('t1', 'Sarah Jenkins', 'Sarah', '-', 'sarahjenkins@edu.com', 'Mathematics', '["Mathematics"]', '["Upper Secondary"]', '012-345 6789', 'Head of Mathematics Department.'),
('t2', 'David Lee', 'David', '李', 'davidlee@edu.com', 'Science', '["Science", "Physics"]', '["Upper Secondary", "Science"]', '016-789 0123', 'Science and Physics Teacher.'),
('t3', 'Elena Tan', 'Elena', '陈', 'elenatan@edu.com', 'English', '["English", "History"]', '["Standard 3", "Form 3", "Form 4"]', '013-111 2233', 'Humanities educator covering English and History.');

-- Insert rating categories
INSERT OR IGNORE INTO rating_categories (id, name, description) VALUES
(1, 'Attention', 'Focus and concentration'),
(2, 'Participation', 'Level of engagement'),
(3, 'Homework', 'Homework completion and quality'),
(4, 'Behavior', 'General conduct'),
(5, 'Practice', 'Practice habits and effort');

-- Insert classes
INSERT INTO classes (id, name, teacher_id, location_id, grade, default_schedule) VALUES
('c1', 'Form 4 Mathematics A', 't1', 'l1', 'Form 4', '{"days": ["Monday"], "time": "09:00", "durationMinutes": 60}'),
('c2', 'Form 4 Science B', 't2', 'l2', 'Form 4', '{"days": ["Wednesday"], "time": "11:00", "durationMinutes": 60}'),
('c3', 'Standard 3 English & History', 't3', 'l3', 'Standard 3', '{"days": ["Tuesday", "Thursday"], "time": "10:00", "durationMinutes": 75}'),
('c4', 'Form 4 Mathematics B', 't1', 'l1', 'Form 4', '{"days": ["Wednesday", "Friday"], "time": "14:00", "durationMinutes": 60}');

-- Insert students
INSERT INTO students (id, name, parent_id, class_ids, attendance, at_risk, school, parent_name, relationship, emergency_contact, parent_email, address) VALUES
('s1', 'Ali Ahmad', 'u_p1', '["c1", "c2", "c3", "c4"]', 95, false, 'City High School', 'Mr. Ahmad', 'Father', '016-5709826', 'ahmad@edu.com', 'Jalan Cerdas, Taman Connaught, 56000 Kuala Lumpur'),
('s2', 'Ben Wong', 'u_p2', '["c1", "c3", "c4"]', 88, false, 'Valley International', 'Mrs. Wong', 'Mother', '013-3334444', 'benwong@edu.com', 'Jalan Yong Shook Lin, PJ New Town, 46200 Petaling Jaya'),
('s3', 'Charlie Davis', 'u_p3', '["c2", "c3"]', 65, true, 'North Academy', 'Ms. Davis', 'Mother', '019-5556666', 'charliedavis@edu.com', 'Jalan SS 15/8, 47500 Subang Jaya, Selangor'),
('s4', 'Goh Shu Ting', 'u_p4', '["c1", "c2", "c4"]', 92, false, 'International School', 'Ms. Goh', 'Mother', '014-7778888', 'gohshuting@edu.com', 'Jalan Ampang Hilir, 55000 Kuala Lumpur');

-- Insert sessions for class c1
INSERT INTO sessions (id, class_id, date, start_time, duration_minutes, type, status) VALUES
('ses_c1_1', 'c1', '2025-10-07', '09:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c1_2', 'c1', '2025-10-14', '09:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c1_3', 'c1', '2025-10-21', '09:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c1_4', 'c1', '2025-10-28', '09:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c1_5', 'c1', '2025-11-04', '09:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c1_6', 'c1', '2025-11-11', '09:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c1_7', 'c1', '2025-11-18', '09:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c1_8', 'c1', '2025-11-25', '09:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c1_9', 'c1', '2025-12-02', '09:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c1_10', 'c1', '2025-12-09', '09:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c1_11', 'c1', '2025-12-16', '09:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c1_12', 'c1', '2025-12-23', '09:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c1_13', 'c1', '2025-12-30', '09:00', 60, 'REGULAR', 'COMPLETED');

-- Insert sessions for class c2
INSERT INTO sessions (id, class_id, date, start_time, duration_minutes, type, status) VALUES
('ses_c2_1', 'c2', '2025-10-02', '11:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c2_2', 'c2', '2025-10-09', '11:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c2_3', 'c2', '2025-10-16', '11:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c2_4', 'c2', '2025-10-23', '11:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c2_5', 'c2', '2025-10-30', '11:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c2_6', 'c2', '2025-11-06', '11:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c2_7', 'c2', '2025-11-13', '11:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c2_8', 'c2', '2025-11-20', '11:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c2_9', 'c2', '2025-11-27', '11:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c2_10', 'c2', '2025-12-04', '11:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c2_11', 'c2', '2025-12-11', '11:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c2_12', 'c2', '2025-12-18', '11:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c2_13', 'c2', '2025-12-25', '11:00', 60, 'REGULAR', 'COMPLETED');

-- Insert sessions for class c3
INSERT INTO sessions (id, class_id, date, start_time, duration_minutes, type, status) VALUES
('ses_c3_1', 'c3', '2025-11-05', '10:00', 75, 'REGULAR', 'COMPLETED'),
('ses_c3_2', 'c3', '2025-11-12', '10:00', 75, 'REGULAR', 'COMPLETED'),
('ses_c3_3', 'c3', '2025-11-19', '10:00', 75, 'REGULAR', 'COMPLETED'),
('ses_c3_4', 'c3', '2025-11-26', '10:00', 75, 'REGULAR', 'COMPLETED');

-- Insert sessions for class c4 (Sarah Jenkins - Wed & Fri)
INSERT INTO sessions (id, class_id, date, start_time, duration_minutes, type, status) VALUES
('ses_c4_1', 'c4', '2025-10-01', '14:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c4_2', 'c4', '2025-10-03', '14:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c4_3', 'c4', '2025-10-08', '14:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c4_4', 'c4', '2025-10-10', '14:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c4_5', 'c4', '2025-10-15', '14:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c4_6', 'c4', '2025-10-17', '14:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c4_7', 'c4', '2025-10-22', '14:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c4_8', 'c4', '2025-10-24', '14:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c4_9', 'c4', '2025-10-29', '14:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c4_10', 'c4', '2025-10-31', '14:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c4_11', 'c4', '2025-11-05', '14:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c4_12', 'c4', '2025-11-07', '14:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c4_13', 'c4', '2025-11-12', '14:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c4_14', 'c4', '2025-11-14', '14:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c4_15', 'c4', '2025-11-19', '14:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c4_16', 'c4', '2025-11-21', '14:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c4_17', 'c4', '2025-11-26', '14:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c4_18', 'c4', '2025-11-28', '14:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c4_19', 'c4', '2025-12-03', '14:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c4_20', 'c4', '2025-12-05', '14:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c4_21', 'c4', '2025-12-10', '14:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c4_22', 'c4', '2025-12-12', '14:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c4_23', 'c4', '2025-12-17', '14:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c4_24', 'c4', '2025-12-19', '14:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c4_25', 'c4', '2025-12-24', '14:00', 60, 'REGULAR', 'COMPLETED'),
('ses_c4_26', 'c4', '2025-12-26', '14:00', 60, 'REGULAR', 'COMPLETED');

-- Insert scores
INSERT INTO scores (student_id, date, subject, value, teacher_id, type) VALUES
('s1', '2025-10-15', 'Mathematics', 85, 't1', 'EXAM'),
('s2', '2025-10-15', 'Mathematics', 78, 't1', 'EXAM'),
('s3', '2025-10-16', 'Science', 45, 't2', 'EXAM'),
('s1', '2025-11-20', 'Mathematics', 88, 't1', 'EXAM'),
('s2', '2025-11-20', 'Mathematics', 82, 't1', 'EXAM'),
('s3', '2025-11-20', 'Science', 50, 't2', 'EXAM'),
('s1', '2025-12-15', 'Mathematics', 92, 't1', 'EXAM'),
('s2', '2025-12-15', 'Mathematics', 85, 't1', 'EXAM'),
('s3', '2025-12-15', 'Science', 48, 't2', 'EXAM'),
('s1', '2025-11-06', 'English', 89, 't3', 'EXAM'),
('s2', '2025-11-06', 'English', 91, 't3', 'EXAM'),
('s3', '2025-11-06', 'History', 78, 't3', 'EXAM'),
('s1', '2025-12-10', 'History', 87, 't3', 'EXAM'),
('s1', '2025-12-05', 'Mathematics', 78, 't1', 'QUIZ'),
('s2', '2025-12-05', 'Mathematics', 81, 't1', 'QUIZ'),
('s3', '2025-12-06', 'Science', 72, 't2', 'QUIZ'),
('s1', '2025-12-11', 'English', 88, 't3', 'QUIZ'),
('s4', '2025-12-08', 'Mathematics', 83, 't1', 'QUIZ'),
('s4', '2025-12-12', 'Science', 76, 't2', 'PRESENTATION'),
('s4', '2025-12-14', 'History', 81, 't3', 'HOMEWORK'),
('s2', '2025-12-12', 'English', 80, 't3', 'LAB');

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

-- ses_c2_13: 2025-12-25 (Wednesday)
-- No attendance records for cancelled sessions


-- Class c3 (English & History) November Sessions
-- Ali Ahmad (s1) - also in English, Ben Wong (s2), Charlie Davis (s3)
-- ses_c3_1: 2025-11-05 (Tuesday)
INSERT INTO attendance (id, student_id, session_id, status, reason) VALUES
('att_c3_1_s1', 's1', 'ses_c3_1', 'PRESENT', NULL),
('att_c3_1_s2', 's2', 'ses_c3_1', 'PRESENT', NULL),
('att_c3_1_s3', 's3', 'ses_c3_1', 'PRESENT', NULL)
ON CONFLICT (student_id, session_id) DO NOTHING;

-- ses_c3_2: 2025-11-12 (Tuesday)
INSERT INTO attendance (id, student_id, session_id, status, reason) VALUES
('att_c3_2_s1', 's1', 'ses_c3_2', 'PRESENT', NULL),
('att_c3_2_s2', 's2', 'ses_c3_2', 'PRESENT', NULL),
('att_c3_2_s3', 's3', 'ses_c3_2', 'ABSENT', 'Sick leave')
ON CONFLICT (student_id, session_id) DO NOTHING;

-- ============================================================================
-- BEHAVIOR RATINGS (Session Ratings) FOR DECEMBER 2025
-- Categories: Attention, Participation, Homework, Behavior, Practice
-- Rating scale: 1-5 (1=Poor, 5=Excellent)
-- Only for sessions where students were PRESENT
-- ============================================================================

-- Class c1 Session 9 (2025-12-02) - Ali Ahmad, Ben Wong, Goh Shu Ting present
INSERT INTO behaviors (student_id, session_id, date, category, teacher_id, rating) VALUES
-- Ali Ahmad ratings
('s1', 'ses_c1_9', '2025-12-02 09:00:00', 'Attention', 't1', 5),
('s1', 'ses_c1_9', '2025-12-02 09:00:00', 'Participation', 't1', 5),
('s1', 'ses_c1_9', '2025-12-02 09:00:00', 'Homework', 't1', 5),
('s1', 'ses_c1_9', '2025-12-02 09:00:00', 'Behavior', 't1', 5),
('s1', 'ses_c1_9', '2025-12-02 09:00:00', 'Practice', 't1', 4),
-- Ben Wong ratings
('s2', 'ses_c1_9', '2025-12-02 09:00:00', 'Attention', 't1', 4),
('s2', 'ses_c1_9', '2025-12-02 09:00:00', 'Participation', 't1', 4),
('s2', 'ses_c1_9', '2025-12-02 09:00:00', 'Homework', 't1', 4),
('s2', 'ses_c1_9', '2025-12-02 09:00:00', 'Behavior', 't1', 5),
('s2', 'ses_c1_9', '2025-12-02 09:00:00', 'Practice', 't1', 4),
-- Goh Shu Ting ratings
('s4', 'ses_c1_9', '2025-12-02 09:00:00', 'Attention', 't1', 5),
('s4', 'ses_c1_9', '2025-12-02 09:00:00', 'Participation', 't1', 4),
('s4', 'ses_c1_9', '2025-12-02 09:00:00', 'Homework', 't1', 5),
('s4', 'ses_c1_9', '2025-12-02 09:00:00', 'Behavior', 't1', 5),
('s4', 'ses_c1_9', '2025-12-02 09:00:00', 'Practice', 't1', 5);

-- Class c1 Session 10 (2025-12-09) - Ali Ahmad, Goh Shu Ting present (Ben Wong absent)
INSERT INTO behaviors (student_id, session_id, date, category, teacher_id, rating) VALUES
-- Ali Ahmad ratings
('s1', 'ses_c1_10', '2025-12-09 09:00:00', 'Attention', 't1', 4),
('s1', 'ses_c1_10', '2025-12-09 09:00:00', 'Participation', 't1', 5),
('s1', 'ses_c1_10', '2025-12-09 09:00:00', 'Homework', 't1', 5),
('s1', 'ses_c1_10', '2025-12-09 09:00:00', 'Behavior', 't1', 5),
('s1', 'ses_c1_10', '2025-12-09 09:00:00', 'Practice', 't1', 5),
-- Goh Shu Ting ratings
('s4', 'ses_c1_10', '2025-12-09 09:00:00', 'Attention', 't1', 4),
('s4', 'ses_c1_10', '2025-12-09 09:00:00', 'Participation', 't1', 4),
('s4', 'ses_c1_10', '2025-12-09 09:00:00', 'Homework', 't1', 5),
('s4', 'ses_c1_10', '2025-12-09 09:00:00', 'Behavior', 't1', 5),
('s4', 'ses_c1_10', '2025-12-09 09:00:00', 'Practice', 't1', 4);

-- Class c1 Session 11 (2025-12-16) - Ali Ahmad, Ben Wong present (Goh Shu Ting absent)
INSERT INTO behaviors (student_id, session_id, date, category, teacher_id, rating) VALUES
-- Ali Ahmad ratings
('s1', 'ses_c1_11', '2025-12-16 09:00:00', 'Attention', 't1', 5),
('s1', 'ses_c1_11', '2025-12-16 09:00:00', 'Participation', 't1', 5),
('s1', 'ses_c1_11', '2025-12-16 09:00:00', 'Homework', 't1', 4),
('s1', 'ses_c1_11', '2025-12-16 09:00:00', 'Behavior', 't1', 5),
('s1', 'ses_c1_11', '2025-12-16 09:00:00', 'Practice', 't1', 5),
-- Ben Wong ratings
('s2', 'ses_c1_11', '2025-12-16 09:00:00', 'Attention', 't1', 4),
('s2', 'ses_c1_11', '2025-12-16 09:00:00', 'Participation', 't1', 3),
('s2', 'ses_c1_11', '2025-12-16 09:00:00', 'Homework', 't1', 4),
('s2', 'ses_c1_11', '2025-12-16 09:00:00', 'Behavior', 't1', 4),
('s2', 'ses_c1_11', '2025-12-16 09:00:00', 'Practice', 't1', 4);

-- Class c1 Session 12 (2025-12-23) - All three present
INSERT INTO behaviors (student_id, session_id, date, category, teacher_id, rating) VALUES
-- Ali Ahmad ratings
('s1', 'ses_c1_12', '2025-12-23 09:00:00', 'Attention', 't1', 5),
('s1', 'ses_c1_12', '2025-12-23 09:00:00', 'Participation', 't1', 5),
('s1', 'ses_c1_12', '2025-12-23 09:00:00', 'Homework', 't1', 5),
('s1', 'ses_c1_12', '2025-12-23 09:00:00', 'Behavior', 't1', 5),
('s1', 'ses_c1_12', '2025-12-23 09:00:00', 'Practice', 't1', 5),
-- Ben Wong ratings
('s2', 'ses_c1_12', '2025-12-23 09:00:00', 'Attention', 't1', 4),
('s2', 'ses_c1_12', '2025-12-23 09:00:00', 'Participation', 't1', 4),
('s2', 'ses_c1_12', '2025-12-23 09:00:00', 'Homework', 't1', 5),
('s2', 'ses_c1_12', '2025-12-23 09:00:00', 'Behavior', 't1', 5),
('s2', 'ses_c1_12', '2025-12-23 09:00:00', 'Practice', 't1', 4),
-- Goh Shu Ting ratings
('s4', 'ses_c1_12', '2025-12-23 09:00:00', 'Attention', 't1', 5),
('s4', 'ses_c1_12', '2025-12-23 09:00:00', 'Participation', 't1', 5),
('s4', 'ses_c1_12', '2025-12-23 09:00:00', 'Homework', 't1', 5),
('s4', 'ses_c1_12', '2025-12-23 09:00:00', 'Behavior', 't1', 5),
('s4', 'ses_c1_12', '2025-12-23 09:00:00', 'Practice', 't1', 5);

-- Class c1 Session 13 (2025-12-30) - Ben Wong, Goh Shu Ting present (Ali Ahmad absent)
INSERT INTO behaviors (student_id, session_id, date, category, teacher_id, rating) VALUES
-- Ben Wong ratings
('s2', 'ses_c1_13', '2025-12-30 09:00:00', 'Attention', 't1', 4),
('s2', 'ses_c1_13', '2025-12-30 09:00:00', 'Participation', 't1', 4),
('s2', 'ses_c1_13', '2025-12-30 09:00:00', 'Homework', 't1', 4),
('s2', 'ses_c1_13', '2025-12-30 09:00:00', 'Behavior', 't1', 5),
('s2', 'ses_c1_13', '2025-12-30 09:00:00', 'Practice', 't1', 4),
-- Goh Shu Ting ratings
('s4', 'ses_c1_13', '2025-12-30 09:00:00', 'Attention', 't1', 5),
('s4', 'ses_c1_13', '2025-12-30 09:00:00', 'Participation', 't1', 4),
('s4', 'ses_c1_13', '2025-12-30 09:00:00', 'Homework', 't1', 5),
('s4', 'ses_c1_13', '2025-12-30 09:00:00', 'Behavior', 't1', 5),
('s4', 'ses_c1_13', '2025-12-30 09:00:00', 'Practice', 't1', 5);

-- Class c2 Session 10 (2025-12-04) - Ali Ahmad, Goh Shu Ting present
INSERT INTO behaviors (student_id, session_id, date, category, teacher_id, rating) VALUES
-- Ali Ahmad ratings
('s1', 'ses_c2_10', '2025-12-04 11:00:00', 'Attention', 't2', 5),
('s1', 'ses_c2_10', '2025-12-04 11:00:00', 'Participation', 't2', 5),
('s1', 'ses_c2_10', '2025-12-04 11:00:00', 'Homework', 't2', 5),
('s1', 'ses_c2_10', '2025-12-04 11:00:00', 'Behavior', 't2', 5),
('s1', 'ses_c2_10', '2025-12-04 11:00:00', 'Practice', 't2', 4),
-- Goh Shu Ting ratings
('s4', 'ses_c2_10', '2025-12-04 11:00:00', 'Attention', 't2', 4),
('s4', 'ses_c2_10', '2025-12-04 11:00:00', 'Participation', 't2', 5),
('s4', 'ses_c2_10', '2025-12-04 11:00:00', 'Homework', 't2', 5),
('s4', 'ses_c2_10', '2025-12-04 11:00:00', 'Behavior', 't2', 5),
('s4', 'ses_c2_10', '2025-12-04 11:00:00', 'Practice', 't2', 5);

-- Class c2 Session 11 (2025-12-11) - Ali Ahmad, Goh Shu Ting present
INSERT INTO behaviors (student_id, session_id, date, category, teacher_id, rating) VALUES
-- Ali Ahmad ratings
('s1', 'ses_c2_11', '2025-12-11 11:00:00', 'Attention', 't2', 5),
('s1', 'ses_c2_11', '2025-12-11 11:00:00', 'Participation', 't2', 4),
('s1', 'ses_c2_11', '2025-12-11 11:00:00', 'Homework', 't2', 5),
('s1', 'ses_c2_11', '2025-12-11 11:00:00', 'Behavior', 't2', 5),
('s1', 'ses_c2_11', '2025-12-11 11:00:00', 'Practice', 't2', 5),
-- Goh Shu Ting ratings
('s4', 'ses_c2_11', '2025-12-11 11:00:00', 'Attention', 't2', 5),
('s4', 'ses_c2_11', '2025-12-11 11:00:00', 'Participation', 't2', 5),
('s4', 'ses_c2_11', '2025-12-11 11:00:00', 'Homework', 't2', 5),
('s4', 'ses_c2_11', '2025-12-11 11:00:00', 'Behavior', 't2', 5),
('s4', 'ses_c2_11', '2025-12-11 11:00:00', 'Practice', 't2', 4);

-- Class c2 Session 12 (2025-12-18) - Ali Ahmad present (Goh Shu Ting absent)
INSERT INTO behaviors (student_id, session_id, date, category, teacher_id, rating) VALUES
-- Ali Ahmad ratings
('s1', 'ses_c2_12', '2025-12-18 11:00:00', 'Attention', 't2', 5),
('s1', 'ses_c2_12', '2025-12-18 11:00:00', 'Participation', 't2', 5),
('s1', 'ses_c2_12', '2025-12-18 11:00:00', 'Homework', 't2', 5),
('s1', 'ses_c2_12', '2025-12-18 11:00:00', 'Behavior', 't2', 5),
('s1', 'ses_c2_12', '2025-12-18 11:00:00', 'Practice', 't2', 5);

-- Session c2_13 (2025-12-25) was CANCELLED - no behavior ratings

-- Class c3 Session 1 (2025-11-05) - Ali Ahmad, Ben Wong, Charlie Davis
INSERT INTO behaviors (student_id, session_id, date, category, teacher_id, rating) VALUES
-- Ali Ahmad ratings
('s1', 'ses_c3_1', '2025-11-05 10:00:00', 'Attention', 't3', 5),
('s1', 'ses_c3_1', '2025-11-05 10:00:00', 'Participation', 't3', 5),
('s1', 'ses_c3_1', '2025-11-05 10:00:00', 'Homework', 't3', 4),
('s1', 'ses_c3_1', '2025-11-05 10:00:00', 'Behavior', 't3', 5),
('s1', 'ses_c3_1', '2025-11-05 10:00:00', 'Practice', 't3', 4),
-- Ben Wong ratings
('s2', 'ses_c3_1', '2025-11-05 10:00:00', 'Attention', 't3', 5),
('s2', 'ses_c3_1', '2025-11-05 10:00:00', 'Participation', 't3', 4),
('s2', 'ses_c3_1', '2025-11-05 10:00:00', 'Homework', 't3', 5),
('s2', 'ses_c3_1', '2025-11-05 10:00:00', 'Behavior', 't3', 4),
('s2', 'ses_c3_1', '2025-11-05 10:00:00', 'Practice', 't3', 5),
-- Charlie Davis ratings
('s3', 'ses_c3_1', '2025-11-05 10:00:00', 'Attention', 't3', 4),
('s3', 'ses_c3_1', '2025-11-05 10:00:00', 'Participation', 't3', 4),
('s3', 'ses_c3_1', '2025-11-05 10:00:00', 'Homework', 't3', 3),
('s3', 'ses_c3_1', '2025-11-05 10:00:00', 'Behavior', 't3', 4),
('s3', 'ses_c3_1', '2025-11-05 10:00:00', 'Practice', 't3', 3);

-- Class c3 Session 2 (2025-11-12) - Charlie Davis absent
INSERT INTO behaviors (student_id, session_id, date, category, teacher_id, rating) VALUES
-- Ali Ahmad ratings
('s1', 'ses_c3_2', '2025-11-12 10:00:00', 'Attention', 't3', 5),
('s1', 'ses_c3_2', '2025-11-12 10:00:00', 'Participation', 't3', 5),
('s1', 'ses_c3_2', '2025-11-12 10:00:00', 'Homework', 't3', 4),
('s1', 'ses_c3_2', '2025-11-12 10:00:00', 'Behavior', 't3', 5),
('s1', 'ses_c3_2', '2025-11-12 10:00:00', 'Practice', 't3', 5),
-- Ben Wong ratings
('s2', 'ses_c3_2', '2025-11-12 10:00:00', 'Attention', 't3', 4),
('s2', 'ses_c3_2', '2025-11-12 10:00:00', 'Participation', 't3', 4),
('s2', 'ses_c3_2', '2025-11-12 10:00:00', 'Homework', 't3', 5),
('s2', 'ses_c3_2', '2025-11-12 10:00:00', 'Behavior', 't3', 4),
('s2', 'ses_c3_2', '2025-11-12 10:00:00', 'Practice', 't3', 4);

-- Class c3 Session 5 (2025-12-02) - Ali Ahmad, Ben Wong, Charlie Davis present
INSERT INTO sessions (id, class_id, date, start_time, duration_minutes, type, status) VALUES
('ses_c3_5', 'c3', '2025-12-02', '10:00', 75, 'REGULAR', 'COMPLETED');

INSERT INTO attendance (id, student_id, session_id, status, reason) VALUES
('att_c3_5_s1', 's1', 'ses_c3_5', 'PRESENT', NULL),
('att_c3_5_s2', 's2', 'ses_c3_5', 'PRESENT', NULL),
('att_c3_5_s3', 's3', 'ses_c3_5', 'PRESENT', NULL)
ON CONFLICT (student_id, session_id) DO NOTHING;

INSERT INTO behaviors (student_id, session_id, date, category, teacher_id, rating) VALUES
('s1', 'ses_c3_5', '2025-12-02 10:00:00', 'Attention', 't3', 5),
('s1', 'ses_c3_5', '2025-12-02 10:00:00', 'Participation', 't3', 4),
('s1', 'ses_c3_5', '2025-12-02 10:00:00', 'Homework', 't3', 5),
('s1', 'ses_c3_5', '2025-12-02 10:00:00', 'Behavior', 't3', 5),
('s1', 'ses_c3_5', '2025-12-02 10:00:00', 'Practice', 't3', 4),
('s2', 'ses_c3_5', '2025-12-02 10:00:00', 'Attention', 't3', 4),
('s2', 'ses_c3_5', '2025-12-02 10:00:00', 'Participation', 't3', 4),
('s2', 'ses_c3_5', '2025-12-02 10:00:00', 'Homework', 't3', 4),
('s2', 'ses_c3_5', '2025-12-02 10:00:00', 'Behavior', 't3', 4),
('s2', 'ses_c3_5', '2025-12-02 10:00:00', 'Practice', 't3', 4);

-- Class c3 Session 6 (2025-12-09) - Ali Ahmad, Ben Wong present (Charlie Davis absent)
INSERT INTO sessions (id, class_id, date, start_time, duration_minutes, type, status) VALUES
('ses_c3_6', 'c3', '2025-12-09', '10:00', 75, 'REGULAR', 'COMPLETED');

INSERT INTO attendance (id, student_id, session_id, status, reason) VALUES
('att_c3_6_s1', 's1', 'ses_c3_6', 'PRESENT', NULL),
('att_c3_6_s2', 's2', 'ses_c3_6', 'PRESENT', NULL)
ON CONFLICT (student_id, session_id) DO NOTHING;

INSERT INTO behaviors (student_id, session_id, date, category, teacher_id, rating) VALUES
('s1', 'ses_c3_6', '2025-12-09 10:00:00', 'Attention', 't3', 5),
('s1', 'ses_c3_6', '2025-12-09 10:00:00', 'Participation', 't3', 5),
('s1', 'ses_c3_6', '2025-12-09 10:00:00', 'Homework', 't3', 4),
('s1', 'ses_c3_6', '2025-12-09 10:00:00', 'Behavior', 't3', 5),
('s1', 'ses_c3_6', '2025-12-09 10:00:00', 'Practice', 't3', 4),
('s2', 'ses_c3_6', '2025-12-09 10:00:00', 'Attention', 't3', 4),
('s2', 'ses_c3_6', '2025-12-09 10:00:00', 'Participation', 't3', 4),
('s2', 'ses_c3_6', '2025-12-09 10:00:00', 'Homework', 't3', 5),
('s2', 'ses_c3_6', '2025-12-09 10:00:00', 'Behavior', 't3', 4),
('s2', 'ses_c3_6', '2025-12-09 10:00:00', 'Practice', 't3', 4);

-- Seed student insights to support manual indicators
INSERT INTO student_insights (student_id, insights, last_analyzed) VALUES
('s1', '[{"student_id":"s1","type":"POSITIVE","message":"Ali consistently contributes in English discussions and shows curiosity beyond the syllabus.","date":"2025-12-19T10:15:00Z"},{"student_id":"s1","type":"NEGATIVE","message":"Needs to slow down when writing essays to avoid careless mistakes.","date":"2025-12-19T10:20:00Z"}]', '2025-12-19T10:30:00Z'),
('s3', '[{"student_id":"s3","type":"OVERALL","message":"Charlie is improving in Science contributions but still needs encouragement to speak up in class.","date":"2025-12-18T08:45:00Z"}]', '2025-12-18T09:00:00Z');
