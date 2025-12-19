/**
 * ScoreRepository
 * Data access layer for score operations
 */

import { BaseRepository } from './BaseRepository.js';

class ScoreRepository extends BaseRepository {
  constructor() {
    super('scores');
  }

  /**
   * Transform database row to camelCase object
   */
  transformRow(row) {
    if (!row) return null;
    // Create a composite ID from student_id, date, and subject
    const id = `${row.student_id}_${row.date}_${row.subject}`;
    return {
      id,
      studentId: row.student_id,
      date: row.date,
      subject: row.subject,
      value: row.value,
      type: row.type,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Get all scores
   */
  async findAll() {
    const query = 'SELECT * FROM scores ORDER BY date DESC';
    const result = await this.executeQuery(query);
    return result.rows.map(row => this.transformRow(row));
  }

  /**
   * Get scores by student ID
   */
  async findByStudentId(studentId) {
    const query = 'SELECT * FROM scores WHERE student_id = $1 ORDER BY date DESC';
    const result = await this.executeQuery(query, [studentId]);
    return result.rows.map(row => this.transformRow(row));
  }

  /**
   * Get scores by subject
   */
  async findBySubject(subject) {
    const query = 'SELECT * FROM scores WHERE subject = $1 ORDER BY date DESC';
    const result = await this.executeQuery(query, [subject]);
    return result.rows.map(row => this.transformRow(row));
  }

  /**
   * Get scores by type
   */
  async findByType(type) {
    const query = 'SELECT * FROM scores WHERE type = $1 ORDER BY date DESC';
    const result = await this.executeQuery(query, [type]);
    return result.rows.map(row => this.transformRow(row));
  }

  /**
   * Get scores by student and subject
   */
  async findByStudentAndSubject(studentId, subject) {
    const query = 'SELECT * FROM scores WHERE student_id = $1 AND subject = $2 ORDER BY date DESC';
    const result = await this.executeQuery(query, [studentId, subject]);
    return result.rows.map(row => this.transformRow(row));
  }

  /**
   * Create score record
   */
  async createScore(scoreData) {
    const { studentId, date, subject, value, type } = scoreData;
    
    const query = `
      INSERT INTO scores (student_id, date, subject, value, type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await this.executeQuery(query, [studentId, date, subject, value, type]);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Update score record
   */
  async updateScore(studentId, date, subject, scoreData) {
    const { value, type } = scoreData;
    
    const query = `
      UPDATE scores
      SET value = COALESCE($1, value),
          type = COALESCE($2, type),
          updated_at = NOW()
      WHERE student_id = $3 AND date = $4 AND subject = $5
      RETURNING *
    `;
    
    const result = await this.executeQuery(query, [value, type, studentId, date, subject]);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Delete score record
   */
  async deleteScore(studentId, date, subject) {
    const query = `
      DELETE FROM scores 
      WHERE student_id = $1 AND date = $2 AND subject = $3
      RETURNING *
    `;
    const result = await this.executeQuery(query, [studentId, date, subject]);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Delete scores by student ID
   */
  async deleteByStudentId(studentId) {
    const query = 'DELETE FROM scores WHERE student_id = $1';
    await this.executeQuery(query, [studentId]);
  }

  /**
   * Find score by student, date, and subject
   */
  async findByStudentDateSubject(studentId, date, subject) {
    const query = 'SELECT * FROM scores WHERE student_id = $1 AND date = $2 AND subject = $3';
    const result = await this.executeQuery(query, [studentId, date, subject]);
    return this.transformRow(result.rows[0]);
  }
}

export default new ScoreRepository();

