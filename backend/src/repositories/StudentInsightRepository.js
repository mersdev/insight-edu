/**
 * StudentInsightRepository
 * Data access layer for student insight operations
 */

import { BaseRepository } from './BaseRepository.js';

class StudentInsightRepository extends BaseRepository {
  constructor() {
    super('student_insights');
  }

  /**
   * Transform database row to camelCase object
   */
  transformRow(row) {
    if (!row) return null;
    return {
      studentId: row.student_id,
      insights: row.insights,
      lastAnalyzed: row.last_analyzed
    };
  }

  /**
   * Get all student insights
   */
  async findAll() {
    const query = 'SELECT * FROM student_insights ORDER BY student_id';
    const result = await this.executeQuery(query);
    return result.rows.map(row => this.transformRow(row));
  }

  /**
   * Get student insight by student ID
   */
  async findByStudentId(studentId) {
    const query = 'SELECT * FROM student_insights WHERE student_id = $1';
    const result = await this.executeQuery(query, [studentId]);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Create student insight
   */
  async createInsight(insightData) {
    const { studentId, insights, lastAnalyzed } = insightData;
    
    const query = `
      INSERT INTO student_insights (student_id, insights, last_analyzed)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const insightsJson = typeof insights === 'string' ? insights : JSON.stringify(insights);
    
    const result = await this.executeQuery(query, [studentId, insightsJson, lastAnalyzed]);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Update student insight
   */
  async updateInsight(studentId, insightData) {
    const { insights, lastAnalyzed } = insightData;

    const insightsJson = typeof insights === 'string' ? insights : JSON.stringify(insights);

    const query = `
      UPDATE student_insights
      SET insights = $1,
          last_analyzed = $2
      WHERE student_id = $3
      RETURNING *
    `;

    const result = await this.executeQuery(query, [insightsJson, lastAnalyzed, studentId]);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Delete student insight
   */
  async deleteInsight(studentId) {
    const query = 'DELETE FROM student_insights WHERE student_id = $1 RETURNING *';
    const result = await this.executeQuery(query, [studentId]);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Check if insight exists for student
   */
  async existsByStudentId(studentId) {
    const query = 'SELECT EXISTS(SELECT 1 FROM student_insights WHERE student_id = $1)';
    const result = await this.executeQuery(query, [studentId]);
    return result.rows[0].exists;
  }
}

export default new StudentInsightRepository();

