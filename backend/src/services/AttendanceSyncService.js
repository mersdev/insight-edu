/**
 * AttendanceSyncService
 * Service to synchronize student attendance percentages with actual records
 */

import pool from '../config/database.js';

class AttendanceSyncService {
  /**
   * Calculate attendance percentage for a single student
   */
  async calculateStudentAttendance(studentId, classIds) {
    try {
      // Get all completed sessions for this student's classes
      const sessionsQuery = `
        SELECT id, class_id, target_student_ids
        FROM sessions
        WHERE class_id = ANY($1::varchar[])
          AND status = 'COMPLETED'
      `;
      const sessionsResult = await pool.query(sessionsQuery, [classIds]);
      
      // Filter sessions that apply to this student
      const applicableSessions = sessionsResult.rows.filter(session => {
        const targetIds = session.target_student_ids;
        if (!targetIds || targetIds.length === 0) return true;
        return targetIds.includes(studentId);
      });
      
      if (applicableSessions.length === 0) {
        return 0;
      }
      
      // Get attendance records for these sessions
      const sessionIds = applicableSessions.map(s => s.id);
      const attendanceQuery = `
        SELECT status
        FROM attendance
        WHERE student_id = $1
          AND session_id = ANY($2::varchar[])
      `;
      const attendanceResult = await pool.query(attendanceQuery, [studentId, sessionIds]);
      
      // Count present records
      const presentCount = attendanceResult.rows.filter(r => r.status === 'PRESENT').length;
      
      // Calculate percentage
      return Math.round((presentCount / applicableSessions.length) * 100);
    } catch (error) {
      console.error(`Error calculating attendance for student ${studentId}:`, error.message);
      throw error;
    }
  }

  /**
   * Sync attendance for a single student
   */
  async syncStudentAttendance(studentId) {
    try {
      // Get student data
      const studentQuery = 'SELECT id, class_ids FROM students WHERE id = $1';
      const studentResult = await pool.query(studentQuery, [studentId]);
      
      if (studentResult.rows.length === 0) {
        throw new Error(`Student ${studentId} not found`);
      }
      
      const student = studentResult.rows[0];
      const calculatedAttendance = await this.calculateStudentAttendance(student.id, student.class_ids);
      
      // Update student record
      await pool.query(
        'UPDATE students SET attendance = $1 WHERE id = $2',
        [calculatedAttendance, studentId]
      );
      
      return calculatedAttendance;
    } catch (error) {
      console.error(`Error syncing attendance for student ${studentId}:`, error.message);
      throw error;
    }
  }

  /**
   * Sync attendance for all students
   */
  async syncAllStudents() {
    try {
      const studentsQuery = 'SELECT id, class_ids FROM students';
      const studentsResult = await pool.query(studentsQuery);
      
      const results = {
        total: studentsResult.rows.length,
        updated: 0,
        errors: []
      };
      
      for (const student of studentsResult.rows) {
        try {
          await this.syncStudentAttendance(student.id);
          results.updated++;
        } catch (error) {
          results.errors.push({
            studentId: student.id,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error syncing all students:', error.message);
      throw error;
    }
  }

  /**
   * Sync attendance for students in a specific class
   */
  async syncClassAttendance(classId) {
    try {
      const studentsQuery = `
        SELECT id, class_ids 
        FROM students 
        WHERE $1 = ANY(class_ids)
      `;
      const studentsResult = await pool.query(studentsQuery, [classId]);
      
      const results = {
        total: studentsResult.rows.length,
        updated: 0,
        errors: []
      };
      
      for (const student of studentsResult.rows) {
        try {
          await this.syncStudentAttendance(student.id);
          results.updated++;
        } catch (error) {
          results.errors.push({
            studentId: student.id,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error(`Error syncing class ${classId}:`, error.message);
      throw error;
    }
  }
}

export default new AttendanceSyncService();

