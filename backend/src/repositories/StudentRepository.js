/**
 * Student Repository
 * Handles all database operations for students
 */

import { BaseRepository } from './BaseRepository.js';

export class StudentRepository extends BaseRepository {
  constructor() {
    super('students');
  }

  /**
   * Transform database row to student object
   */
  transformRow(row) {
    return {
      id: row.id,
      name: row.name,
      parentId: row.parent_id,
      classIds: row.class_ids,
      attendance: row.attendance,
      atRisk: row.at_risk,
      school: row.school,
      parentName: row.parent_name,
      relationship: row.relationship,
      emergencyContact: row.emergency_contact,
      parentEmail: row.parent_email
    };
  }

  /**
   * Get all students with transformed data
   */
  async findAll() {
    const rows = await super.findAll();
    return rows.map(row => this.transformRow(row));
  }

  /**
   * Find student by ID with transformed data
   */
  async findById(id) {
    const row = await super.findById(id);
    return this.transformRow(row);
  }

  /**
   * Find students by parent ID
   */
  async findByParentId(parentId) {
    const query = 'SELECT * FROM students WHERE parent_id = $1 ORDER BY name';
    const result = await this.executeQuery(query, [parentId]);
    return result.rows.map(row => this.transformRow(row));
  }

  /**
   * Find students by class ID
   */
  async findByClassId(classId) {
    const query = `SELECT * FROM students WHERE class_ids @> $1 ORDER BY name`;
    const result = await this.executeQuery(query, [JSON.stringify([classId])]);
    return result.rows.map(row => this.transformRow(row));
  }

  /**
   * Create student with proper column mapping
   */
  async createStudent(studentData) {
    const query = `
      INSERT INTO students (
        id, name, parent_id, class_ids, attendance, at_risk, 
        school, parent_name, relationship, emergency_contact, parent_email
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *
    `;
    
    const values = [
      studentData.id,
      studentData.name,
      studentData.parentId,
      JSON.stringify(studentData.classIds),
      studentData.attendance,
      studentData.atRisk,
      studentData.school,
      studentData.parentName,
      studentData.relationship,
      studentData.emergencyContact,
      studentData.parentEmail
    ];
    
    const result = await this.executeQuery(query, values);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Update student with proper column mapping
   */
  async updateStudent(id, studentData) {
    const query = `
      UPDATE students 
      SET name = $1, parent_id = $2, class_ids = $3, attendance = $4, at_risk = $5,
          school = $6, parent_name = $7, relationship = $8, emergency_contact = $9, parent_email = $10
      WHERE id = $11 
      RETURNING *
    `;
    
    const values = [
      studentData.name,
      studentData.parentId,
      JSON.stringify(studentData.classIds),
      studentData.attendance,
      studentData.atRisk,
      studentData.school,
      studentData.parentName,
      studentData.relationship,
      studentData.emergencyContact,
      studentData.parentEmail,
      id
    ];
    
    const result = await this.executeQuery(query, values);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Find at-risk students
   */
  async findAtRiskStudents() {
    const query = 'SELECT * FROM students WHERE at_risk = true ORDER BY name';
    const result = await this.executeQuery(query);
    return result.rows.map(row => this.transformRow(row));
  }
}

export default new StudentRepository();

