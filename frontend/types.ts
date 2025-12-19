

export type Role = 'TEACHER' | 'HQ' | 'PARENT';

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar?: string;
  email?: string;
}

export interface Location {
  id: string;
  name: string;
  address?: string;
}

export interface Student {
  id: string;
  name: string;
  parentId: string;
  classIds: string[]; // Changed from classId to classIds
  attendance: number; // Percentage 0-100
  atRisk: boolean;
  // New Fields
  school?: string;
  parentName?: string;
  relationship?: string;
  emergencyContact?: string;
  parentEmail?: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  subject: string;
  // New Fields
  englishName?: string;
  chineseName?: string;
  phone?: string;
  description?: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  teacherId: string;
  locationId: string;
  grade: string;
  defaultSchedule?: {
    dayOfWeek: string; // 'Monday', 'Tuesday', etc.
    time: string; // '14:00'
  }
}

export interface Session {
  id: string;
  classId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  type: 'REGULAR' | 'SPECIAL';
  status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
  targetStudentIds?: string[]; // If empty, applies to all
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  sessionId: string;
  status: 'PRESENT' | 'ABSENT';
  reason?: string;
}

export interface Score {
  studentId: string;
  date: string;
  subject: string;
  value: number; // 0-100
  type: 'EXAM' | 'HOMEWORK' | 'QUIZ' | 'PRESENTATION' | 'LAB';
}

export interface BehaviorRating {
  studentId: string;
  sessionId?: string; // Added to link behavior to a specific session
  date: string;
  category: 'Attention' | 'Participation' | 'Homework' | 'Behavior' | 'Practice';
  rating: number; // 1-5
}

export interface Insight {
  studentId: string;
  type: 'POSITIVE' | 'NEGATIVE' | 'OVERALL';
  message: string;
  date: string;
}

export interface StudentInsightRecord {
  studentId: string;
  insights: Insight[];
  lastAnalyzed: string;
}

export interface LanguageContextType {
  lang: 'en' | 'zh';
  toggleLang: () => void;
  t: (key: string) => string;
}