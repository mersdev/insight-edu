/**
 * Attendance Calculation Utilities
 * Centralized logic for calculating attendance percentages
 */

import { Student, Session, AttendanceRecord } from '../types';

/**
 * Calculate average attendance percentage across all students
 * @param students - Array of students
 * @param sessions - Array of sessions
 * @param attendance - Array of attendance records
 * @returns Average attendance percentage (0-100)
 */
export function calculateAverageAttendance(
  students: Student[],
  sessions: Session[],
  attendance: AttendanceRecord[]
): number {
  if (students.length === 0 || attendance.length === 0) return 0;
  
  // Get all completed sessions
  const completedSessions = sessions.filter(s => s.status === 'COMPLETED');
  if (completedSessions.length === 0) return 0;
  
  // Calculate attendance rate for each student
  const studentAttendanceRates = students.map(student => {
    // Find all completed sessions for this student's classes
    const studentSessions = completedSessions.filter(session => 
      (student.classIds || []).includes(session.classId) &&
      (!session.targetStudentIds || session.targetStudentIds.includes(student.id))
    );
    
    if (studentSessions.length === 0) return 0;
    
    // Count how many sessions the student attended
    const presentCount = studentSessions.filter(session => {
      const attendanceRecord = attendance.find(
        a => a.sessionId === session.id && a.studentId === student.id
      );
      return attendanceRecord?.status === 'PRESENT';
    }).length;
    
    return (presentCount / studentSessions.length) * 100;
  });
  
  // Calculate average across all students
  const totalRate = studentAttendanceRates.reduce((sum, rate) => sum + rate, 0);
  return Math.round(totalRate / students.length);
}

/**
 * Calculate attendance percentage for a specific student
 * @param student - Student object
 * @param sessions - Array of sessions
 * @param attendance - Array of attendance records
 * @returns Student's attendance percentage (0-100)
 */
export function calculateStudentAttendance(
  student: Student,
  sessions: Session[],
  attendance: AttendanceRecord[]
): number {
  const completedSessions = sessions.filter(s => 
    s.status === 'COMPLETED' &&
    (student.classIds || []).includes(s.classId) &&
    (!s.targetStudentIds || s.targetStudentIds.includes(student.id))
  );
  
  if (completedSessions.length === 0) return 0;
  
  const presentCount = completedSessions.filter(session => {
    const record = attendance.find(
      a => a.sessionId === session.id && a.studentId === student.id
    );
    return record?.status === 'PRESENT';
  }).length;
  
  return Math.round((presentCount / completedSessions.length) * 100);
}

/**
 * Calculate attendance for a specific class
 * @param classId - Class ID
 * @param students - Array of students in the class
 * @param sessions - Array of sessions
 * @param attendance - Array of attendance records
 * @returns Class attendance percentage (0-100)
 */
export function calculateClassAttendance(
  classId: string,
  students: Student[],
  sessions: Session[],
  attendance: AttendanceRecord[]
): number {
  const classStudents = students.filter(s => 
    (s.classIds || []).includes(classId)
  );
  
  if (classStudents.length === 0) return 0;
  
  const classSessions = sessions.filter(s => 
    s.classId === classId && s.status === 'COMPLETED'
  );
  
  if (classSessions.length === 0) return 0;
  
  const totalAttendanceRecords = classSessions.length * classStudents.length;
  const presentRecords = attendance.filter(a => 
    classSessions.some(s => s.id === a.sessionId) &&
    classStudents.some(st => st.id === a.studentId) &&
    a.status === 'PRESENT'
  ).length;
  
  return Math.round((presentRecords / totalAttendanceRecords) * 100);
}
