/**
 * SessionRepository
 * Data access layer for session operations
 */

import { BaseRepository } from './BaseRepository.js';

class SessionRepository extends BaseRepository {
  constructor() {
    super('sessions');
  }

  /**
   * Transform database row to camelCase object
   */
  transformRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      classId: row.class_id,
      date: row.date,
      startTime: row.start_time,
      type: row.type,
      status: row.status,
      targetStudentIds: row.target_student_ids
    };
  }

  /**
   * Get all sessions
   */
  async findAll() {
    const query = 'SELECT * FROM sessions ORDER BY date DESC, start_time';
    const result = await this.executeQuery(query);
    return result.rows.map(row => this.transformRow(row));
  }

  /**
   * Get session by ID
   */
  async findById(id) {
    const query = 'SELECT * FROM sessions WHERE id = $1';
    const result = await this.executeQuery(query, [id]);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Get sessions by class ID
   */
  async findByClassId(classId) {
    const query = 'SELECT * FROM sessions WHERE class_id = $1 ORDER BY date DESC, start_time';
    const result = await this.executeQuery(query, [classId]);
    return result.rows.map(row => this.transformRow(row));
  }

  /**
   * Get sessions by date
   */
  async findByDate(date) {
    const query = 'SELECT * FROM sessions WHERE date = $1 ORDER BY start_time';
    const result = await this.executeQuery(query, [date]);
    return result.rows.map(row => this.transformRow(row));
  }

  /**
   * Get sessions by status
   */
  async findByStatus(status) {
    const query = 'SELECT * FROM sessions WHERE status = $1 ORDER BY date DESC, start_time';
    const result = await this.executeQuery(query, [status]);
    return result.rows.map(row => this.transformRow(row));
  }

  /**
   * Create a new session
   */
  async createSession(sessionData) {
    const { id, classId, date, startTime, type, status, targetStudentIds } = sessionData;
    
    const query = `
      INSERT INTO sessions (id, class_id, date, start_time, type, status, target_student_ids)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const result = await this.executeQuery(query, [
      id, 
      classId, 
      date, 
      startTime, 
      type, 
      status || 'SCHEDULED',
      targetStudentIds ? JSON.stringify(targetStudentIds) : null
    ]);
    
    return this.transformRow(result.rows[0]);
  }

  /**
   * Update a session
   */
  async updateSession(id, sessionData) {
    const { classId, date, startTime, type, status, targetStudentIds } = sessionData;

    const query = `
      UPDATE sessions
      SET class_id = COALESCE($2, class_id),
          date = COALESCE($3, date),
          start_time = COALESCE($4, start_time),
          type = COALESCE($5, type),
          status = COALESCE($6, status),
          target_student_ids = COALESCE($7, target_student_ids)
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.executeQuery(query, [
      id,
      classId,
      date,
      startTime,
      type,
      status,
      targetStudentIds ? JSON.stringify(targetStudentIds) : null
    ]);

    return this.transformRow(result.rows[0]);
  }

  /**
   * Update session status
   */
  async updateStatus(id, status) {
    const query = 'UPDATE sessions SET status = $1 WHERE id = $2 RETURNING *';
    const result = await this.executeQuery(query, [status, id]);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Delete a session
   */
  async deleteSession(id) {
    const query = 'DELETE FROM sessions WHERE id = $1 RETURNING *';
    const result = await this.executeQuery(query, [id]);
    return this.transformRow(result.rows[0]);
  }
}

export default new SessionRepository();

