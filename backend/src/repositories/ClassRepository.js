/**
 * ClassRepository
 * Data access layer for class operations
 */

import { BaseRepository } from './BaseRepository.js';

class ClassRepository extends BaseRepository {
  constructor() {
    super('classes');
  }

  /**
   * Transform database row to camelCase object
   */
  transformRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      teacherId: row.teacher_id,
      locationId: row.location_id,
      grade: row.grade,
      defaultSchedule: row.default_schedule,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Get all classes
   */
  async findAll() {
    const query = 'SELECT * FROM classes ORDER BY id';
    const result = await this.executeQuery(query);
    return result.rows.map(row => this.transformRow(row));
  }

  /**
   * Get class by ID
   */
  async findById(id) {
    const query = 'SELECT * FROM classes WHERE id = $1';
    const result = await this.executeQuery(query, [id]);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Get classes by teacher ID
   */
  async findByTeacherId(teacherId) {
    const query = 'SELECT * FROM classes WHERE teacher_id = $1 ORDER BY name';
    const result = await this.executeQuery(query, [teacherId]);
    return result.rows.map(row => this.transformRow(row));
  }

  /**
   * Get classes by location ID
   */
  async findByLocationId(locationId) {
    const query = 'SELECT * FROM classes WHERE location_id = $1 ORDER BY name';
    const result = await this.executeQuery(query, [locationId]);
    return result.rows.map(row => this.transformRow(row));
  }

  /**
   * Get classes by grade
   */
  async findByGrade(grade) {
    const query = 'SELECT * FROM classes WHERE grade = $1 ORDER BY name';
    const result = await this.executeQuery(query, [grade]);
    return result.rows.map(row => this.transformRow(row));
  }

  /**
   * Create a new class
   */
  async createClass(classData) {
    const { id, name, teacherId, locationId, grade, defaultSchedule } = classData;
    
    const query = `
      INSERT INTO classes (id, name, teacher_id, location_id, grade, default_schedule)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await this.executeQuery(query, [
      id, 
      name, 
      teacherId, 
      locationId, 
      grade, 
      defaultSchedule ? JSON.stringify(defaultSchedule) : null
    ]);
    
    return this.transformRow(result.rows[0]);
  }

  /**
   * Update a class
   */
  async updateClass(id, classData) {
    const { name, teacherId, locationId, grade, defaultSchedule } = classData;
    
    const query = `
      UPDATE classes
      SET name = COALESCE($2, name),
          teacher_id = COALESCE($3, teacher_id),
          location_id = COALESCE($4, location_id),
          grade = COALESCE($5, grade),
          default_schedule = COALESCE($6, default_schedule),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await this.executeQuery(query, [
      id, 
      name, 
      teacherId, 
      locationId, 
      grade, 
      defaultSchedule ? JSON.stringify(defaultSchedule) : null
    ]);
    
    return this.transformRow(result.rows[0]);
  }

  /**
   * Delete a class
   */
  async deleteClass(id) {
    const query = 'DELETE FROM classes WHERE id = $1 RETURNING *';
    const result = await this.executeQuery(query, [id]);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Check if class exists by name
   */
  async existsByName(name) {
    const query = 'SELECT EXISTS(SELECT 1 FROM classes WHERE name = $1)';
    const result = await this.executeQuery(query, [name]);
    return result.rows[0].exists;
  }
}

export default new ClassRepository();

