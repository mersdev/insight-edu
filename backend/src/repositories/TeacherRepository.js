/**
 * TeacherRepository
 * Data access layer for teacher operations
 */

import { BaseRepository } from './BaseRepository.js';

class TeacherRepository extends BaseRepository {
  constructor() {
    super('teachers');
  }

  /**
   * Transform database row to camelCase object
   */
  transformRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      englishName: row.english_name,
      chineseName: row.chinese_name,
      email: row.email,
      subject: row.subject,
      phone: row.phone,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Get all teachers
   */
  async findAll() {
    const query = 'SELECT * FROM teachers ORDER BY id';
    const result = await this.executeQuery(query);
    return result.rows.map(row => this.transformRow(row));
  }

  /**
   * Get teacher by ID
   */
  async findById(id) {
    const query = 'SELECT * FROM teachers WHERE id = $1';
    const result = await this.executeQuery(query, [id]);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Get teacher by email
   */
  async findByEmail(email) {
    const query = 'SELECT * FROM teachers WHERE email = $1';
    const result = await this.executeQuery(query, [email]);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Create a new teacher
   */
  async createTeacher(teacherData) {
    const { id, name, englishName, chineseName, email, subject, phone, description } = teacherData;
    
    const query = `
      INSERT INTO teachers (id, name, english_name, chinese_name, email, subject, phone, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const result = await this.executeQuery(query, [
      id, name, englishName, chineseName, email, subject, phone, description
    ]);
    
    return this.transformRow(result.rows[0]);
  }

  /**
   * Update a teacher
   */
  async updateTeacher(id, teacherData) {
    const { name, englishName, chineseName, email, subject, phone, description } = teacherData;
    
    const query = `
      UPDATE teachers
      SET name = COALESCE($2, name),
          english_name = COALESCE($3, english_name),
          chinese_name = COALESCE($4, chinese_name),
          email = COALESCE($5, email),
          subject = COALESCE($6, subject),
          phone = COALESCE($7, phone),
          description = COALESCE($8, description),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await this.executeQuery(query, [
      id, name, englishName, chineseName, email, subject, phone, description
    ]);
    
    return this.transformRow(result.rows[0]);
  }

  /**
   * Delete a teacher
   */
  async deleteTeacher(id) {
    const query = 'DELETE FROM teachers WHERE id = $1 RETURNING *';
    const result = await this.executeQuery(query, [id]);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Get teachers by subject
   */
  async findBySubject(subject) {
    const query = 'SELECT * FROM teachers WHERE subject = $1 ORDER BY name';
    const result = await this.executeQuery(query, [subject]);
    return result.rows.map(row => this.transformRow(row));
  }

  /**
   * Check if teacher exists by email
   */
  async existsByEmail(email) {
    const query = 'SELECT EXISTS(SELECT 1 FROM teachers WHERE email = $1)';
    const result = await this.executeQuery(query, [email]);
    return result.rows[0].exists;
  }
}

export default new TeacherRepository();

