/**
 * BehaviorRepository
 * Data access layer for behavior operations
 */

import { BaseRepository } from './BaseRepository.js';

class BehaviorRepository extends BaseRepository {
  constructor() {
    super('behaviors');
  }

  /**
   * Transform database row to camelCase object
   */
  transformRow(row) {
    if (!row) return null;
    // Create a composite ID from student_id, session_id, and category
    const id = `${row.student_id}_${row.session_id}_${row.category}`;
    return {
      id,
      studentId: row.student_id,
      sessionId: row.session_id,
      date: row.date,
      category: row.category,
      rating: row.rating
    };
  }

  /**
   * Get all behavior records
   */
  async findAll() {
    const query = 'SELECT * FROM behaviors ORDER BY date DESC';
    const result = await this.executeQuery(query);
    return result.rows.map(row => this.transformRow(row));
  }

  /**
   * Get behaviors by student ID
   */
  async findByStudentId(studentId) {
    const query = 'SELECT * FROM behaviors WHERE student_id = $1 ORDER BY date DESC';
    const result = await this.executeQuery(query, [studentId]);
    return result.rows.map(row => this.transformRow(row));
  }

  /**
   * Get behaviors by session ID
   */
  async findBySessionId(sessionId) {
    const query = 'SELECT * FROM behaviors WHERE session_id = $1 ORDER BY student_id';
    const result = await this.executeQuery(query, [sessionId]);
    return result.rows.map(row => this.transformRow(row));
  }

  /**
   * Get behaviors by category
   */
  async findByCategory(category) {
    const query = 'SELECT * FROM behaviors WHERE category = $1 ORDER BY date DESC';
    const result = await this.executeQuery(query, [category]);
    return result.rows.map(row => this.transformRow(row));
  }

  /**
   * Find behavior by student, session, and category
   */
  async findByStudentSessionCategory(studentId, sessionId, category) {
    const query = `
      SELECT * FROM behaviors 
      WHERE student_id = $1 AND session_id = $2 AND category = $3
    `;
    const result = await this.executeQuery(query, [studentId, sessionId, category]);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Create behavior record
   */
  async createBehavior(behaviorData) {
    const { studentId, sessionId, date, category, rating } = behaviorData;
    
    const query = `
      INSERT INTO behaviors (student_id, session_id, date, category, rating)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await this.executeQuery(query, [studentId, sessionId, date, category, rating]);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Update behavior record
   */
  async updateBehavior(studentId, sessionId, category, behaviorData) {
    const { rating, date } = behaviorData;

    const query = `
      UPDATE behaviors
      SET rating = $1,
          date = COALESCE($2, date)
      WHERE student_id = $3 AND session_id = $4 AND category = $5
      RETURNING *
    `;

    const result = await this.executeQuery(query, [rating, date, studentId, sessionId, category]);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Delete behavior record
   */
  async deleteBehavior(studentId, sessionId, category) {
    const query = `
      DELETE FROM behaviors 
      WHERE student_id = $1 AND session_id = $2 AND category = $3
      RETURNING *
    `;
    const result = await this.executeQuery(query, [studentId, sessionId, category]);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Delete behaviors by student ID
   */
  async deleteByStudentId(studentId) {
    const query = 'DELETE FROM behaviors WHERE student_id = $1';
    await this.executeQuery(query, [studentId]);
  }

  /**
   * Delete behaviors by session ID
   */
  async deleteBySessionId(sessionId) {
    const query = 'DELETE FROM behaviors WHERE session_id = $1';
    await this.executeQuery(query, [sessionId]);
  }

  /**
   * Check if behavior exists
   */
  async existsByStudentSessionCategory(studentId, sessionId, category) {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM behaviors 
        WHERE student_id = $1 AND session_id = $2 AND category = $3
      )
    `;
    const result = await this.executeQuery(query, [studentId, sessionId, category]);
    return result.rows[0].exists;
  }
}

export default new BehaviorRepository();

