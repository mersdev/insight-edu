/**
 * AttendanceRepository
 * Data access layer for attendance operations
 */

import { BaseRepository } from './BaseRepository.js';

class AttendanceRepository extends BaseRepository {
  constructor() {
    super('attendance');
  }

  /**
   * Transform database row to camelCase object
   */
  transformRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      studentId: row.student_id,
      sessionId: row.session_id,
      status: row.status,
      reason: row.reason
    };
  }

  /**
   * Get all attendance records
   */
  async findAll() {
    const query = 'SELECT * FROM attendance ORDER BY id';
    const result = await this.executeQuery(query);
    return result.rows.map(row => this.transformRow(row));
  }

  /**
   * Get attendance by ID
   */
  async findById(id) {
    const query = 'SELECT * FROM attendance WHERE id = $1';
    const result = await this.executeQuery(query, [id]);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Get attendance by session ID
   */
  async findBySessionId(sessionId) {
    const query = 'SELECT * FROM attendance WHERE session_id = $1 ORDER BY student_id';
    const result = await this.executeQuery(query, [sessionId]);
    return result.rows.map(row => this.transformRow(row));
  }

  /**
   * Get attendance by student ID
   */
  async findByStudentId(studentId) {
    const query = 'SELECT * FROM attendance WHERE student_id = $1 ORDER BY session_id';
    const result = await this.executeQuery(query, [studentId]);
    return result.rows.map(row => this.transformRow(row));
  }

  /**
   * Find attendance by session and student
   */
  async findBySessionAndStudent(sessionId, studentId) {
    const query = 'SELECT * FROM attendance WHERE session_id = $1 AND student_id = $2';
    const result = await this.executeQuery(query, [sessionId, studentId]);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Create attendance record
   */
  async createAttendance(attendanceData) {
    const { id, studentId, sessionId, status, reason } = attendanceData;
    
    const query = `
      INSERT INTO attendance (id, student_id, session_id, status, reason)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await this.executeQuery(query, [id, studentId, sessionId, status, reason]);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Update attendance record
   */
  async updateAttendance(id, attendanceData) {
    const { status, reason } = attendanceData;

    const query = `
      UPDATE attendance
      SET status = COALESCE($2, status),
          reason = COALESCE($3, reason)
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.executeQuery(query, [id, status, reason]);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Update attendance by session and student
   */
  async updateBySessionAndStudent(sessionId, studentId, attendanceData) {
    const { status, reason } = attendanceData;

    const query = `
      UPDATE attendance
      SET status = $1,
          reason = $2
      WHERE session_id = $3 AND student_id = $4
      RETURNING *
    `;

    const result = await this.executeQuery(query, [status, reason, sessionId, studentId]);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Delete attendance record
   */
  async deleteAttendance(id) {
    const query = 'DELETE FROM attendance WHERE id = $1 RETURNING *';
    const result = await this.executeQuery(query, [id]);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Check if attendance exists for session and student
   */
  async existsBySessionAndStudent(sessionId, studentId) {
    const query = 'SELECT EXISTS(SELECT 1 FROM attendance WHERE session_id = $1 AND student_id = $2)';
    const result = await this.executeQuery(query, [sessionId, studentId]);
    return result.rows[0].exists;
  }
}

export default new AttendanceRepository();

