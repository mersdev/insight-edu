/**
 * AttendanceService
 * Business logic for attendance operations
 */

import AttendanceRepository from '../repositories/AttendanceRepository.js';
import SessionRepository from '../repositories/SessionRepository.js';
import StudentRepository from '../repositories/StudentRepository.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';

class AttendanceService {
  /**
   * Get all attendance records
   */
  async getAllAttendance() {
    return await AttendanceRepository.findAll();
  }

  /**
   * Get attendance by ID
   */
  async getAttendanceById(id) {
    const attendance = await AttendanceRepository.findById(id);
    if (!attendance) {
      throw new NotFoundError('Attendance record not found');
    }
    return attendance;
  }

  /**
   * Get attendance by session ID
   */
  async getAttendanceBySessionId(sessionId) {
    return await AttendanceRepository.findBySessionId(sessionId);
  }

  /**
   * Get attendance by student ID
   */
  async getAttendanceByStudentId(studentId) {
    return await AttendanceRepository.findByStudentId(studentId);
  }

  /**
   * Record or update attendance
   * If attendance exists for session/student, update it; otherwise create new
   */
  async recordAttendance(attendanceData) {
    const { id, studentId, sessionId, status, reason } = attendanceData;

    // Validate attendance data
    this.validateAttendanceData(attendanceData);

    // Verify session exists
    const session = await SessionRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Verify student exists
    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Check if attendance already exists for this session/student
    const existingAttendance = await AttendanceRepository.findBySessionAndStudent(sessionId, studentId);
    
    if (existingAttendance) {
      // Update existing record
      return await AttendanceRepository.updateBySessionAndStudent(sessionId, studentId, { status, reason });
    } else {
      // Create new record
      return await AttendanceRepository.createAttendance({ id, studentId, sessionId, status, reason });
    }
  }

  /**
   * Update attendance record
   */
  async updateAttendance(id, attendanceData) {
    // Check if attendance exists
    const existingAttendance = await AttendanceRepository.findById(id);
    if (!existingAttendance) {
      throw new NotFoundError('Attendance record not found');
    }

    return await AttendanceRepository.updateAttendance(id, attendanceData);
  }

  /**
   * Delete attendance record
   */
  async deleteAttendance(id) {
    const attendance = await AttendanceRepository.findById(id);
    if (!attendance) {
      throw new NotFoundError('Attendance record not found');
    }

    return await AttendanceRepository.deleteAttendance(id);
  }

  /**
   * Validate attendance data
   */
  validateAttendanceData(data) {
    const errors = [];

    if (!data.studentId) {
      errors.push({ field: 'studentId', message: 'Student ID is required' });
    }

    if (!data.sessionId) {
      errors.push({ field: 'sessionId', message: 'Session ID is required' });
    }

    if (!data.status) {
      errors.push({ field: 'status', message: 'Attendance status is required' });
    }

    // Validate status values
    const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push({ 
        field: 'status', 
        message: `Status must be one of: ${validStatuses.join(', ')}` 
      });
    }

    if (errors.length > 0) {
      throw new ValidationError('Attendance validation failed', errors);
    }
  }
}

export default new AttendanceService();

