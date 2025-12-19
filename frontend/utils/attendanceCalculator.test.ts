/**
 * Unit Tests for Attendance Calculator
 * Tests the attendance calculation logic in isolation
 */

import { describe, it, expect } from 'vitest';
import {
  calculateAverageAttendance,
  calculateStudentAttendance,
  calculateClassAttendance,
  calculateLocationAttendance
} from './attendanceCalculator';
import { Student, Session, AttendanceRecord } from '../types';

describe('Attendance Calculator', () => {
  // Mock data
  const mockStudents: Student[] = [
    {
      id: 'S1',
      name: 'Student 1',
      parentId: 'P1',
      classIds: ['C1'],
      attendance: 0, // This should be ignored
      atRisk: false
    },
    {
      id: 'S2',
      name: 'Student 2',
      parentId: 'P2',
      classIds: ['C1'],
      attendance: 0,
      atRisk: false
    }
  ];

  const mockSessions: Session[] = [
    {
      id: 'SESSION1',
      classId: 'C1',
      date: '2024-01-01',
      startTime: '10:00',
      type: 'REGULAR',
      status: 'COMPLETED'
    },
    {
      id: 'SESSION2',
      classId: 'C1',
      date: '2024-01-02',
      startTime: '10:00',
      type: 'REGULAR',
      status: 'COMPLETED'
    },
    {
      id: 'SESSION3',
      classId: 'C1',
      date: '2024-01-03',
      startTime: '10:00',
      type: 'REGULAR',
      status: 'SCHEDULED' // Not completed, should be ignored
    }
  ];

  const mockAttendance: AttendanceRecord[] = [
    { id: 'A1', studentId: 'S1', sessionId: 'SESSION1', status: 'PRESENT' },
    { id: 'A2', studentId: 'S1', sessionId: 'SESSION2', status: 'PRESENT' },
    { id: 'A3', studentId: 'S2', sessionId: 'SESSION1', status: 'PRESENT' },
    { id: 'A4', studentId: 'S2', sessionId: 'SESSION2', status: 'ABSENT' }
  ];

  describe('calculateAverageAttendance', () => {
    it('should calculate correct average attendance', () => {
      const result = calculateAverageAttendance(mockStudents, mockSessions, mockAttendance);
      // S1: 2/2 = 100%, S2: 1/2 = 50%, Average: 75%
      expect(result).toBe(75);
    });

    it('should return 0 when no students', () => {
      const result = calculateAverageAttendance([], mockSessions, mockAttendance);
      expect(result).toBe(0);
    });

    it('should return 0 when no attendance records', () => {
      const result = calculateAverageAttendance(mockStudents, mockSessions, []);
      expect(result).toBe(0);
    });

    it('should return 0 when no completed sessions', () => {
      const scheduledSessions = mockSessions.map(s => ({ ...s, status: 'SCHEDULED' as const }));
      const result = calculateAverageAttendance(mockStudents, scheduledSessions, mockAttendance);
      expect(result).toBe(0);
    });

    it('should ignore cancelled sessions', () => {
      const sessionsWithCancelled: Session[] = [
        ...mockSessions,
        {
          id: 'SESSION4',
          classId: 'C1',
          date: '2024-01-04',
          startTime: '10:00',
          type: 'REGULAR',
          status: 'CANCELLED'
        }
      ];
      const result = calculateAverageAttendance(mockStudents, sessionsWithCancelled, mockAttendance);
      expect(result).toBe(75); // Same as before, cancelled session ignored
    });
  });

  describe('calculateStudentAttendance', () => {
    it('should calculate correct attendance for a student', () => {
      const result = calculateStudentAttendance(mockStudents[0], mockSessions, mockAttendance);
      // S1 attended 2/2 sessions = 100%
      expect(result).toBe(100);
    });

    it('should handle partial attendance', () => {
      const result = calculateStudentAttendance(mockStudents[1], mockSessions, mockAttendance);
      // S2 attended 1/2 sessions = 50%
      expect(result).toBe(50);
    });

    it('should return 0 when student has no completed sessions', () => {
      const studentWithNoClass: Student = {
        id: 'S3',
        name: 'Student 3',
        parentId: 'P3',
        classIds: ['C999'], // Non-existent class
        attendance: 0,
        atRisk: false
      };
      const result = calculateStudentAttendance(studentWithNoClass, mockSessions, mockAttendance);
      expect(result).toBe(0);
    });

    it('should handle targeted sessions correctly', () => {
      const targetedSession: Session = {
        id: 'SESSION_TARGETED',
        classId: 'C1',
        date: '2024-01-05',
        startTime: '10:00',
        type: 'SPECIAL',
        status: 'COMPLETED',
        targetStudentIds: ['S1'] // Only for S1
      };
      const sessions = [...mockSessions, targetedSession];
      const attendance = [
        ...mockAttendance,
        { id: 'A5', studentId: 'S1', sessionId: 'SESSION_TARGETED', status: 'PRESENT' }
      ];
      
      const result = calculateStudentAttendance(mockStudents[0], sessions, attendance);
      // S1: 3/3 sessions = 100%
      expect(result).toBe(100);
    });
  });
});

