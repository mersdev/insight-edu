/**
 * Student Service
 * Business logic for student operations
 * Following Single Responsibility Principle
 */

import StudentRepository from '../repositories/StudentRepository.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

export class StudentService {
  constructor(studentRepository) {
    this.studentRepository = studentRepository;
  }

  /**
   * Get all students
   */
  async getAllStudents() {
    return await this.studentRepository.findAll();
  }

  /**
   * Get student by ID
   */
  async getStudentById(id) {
    return await this.studentRepository.findById(id);
  }

  /**
   * Get students by parent ID
   */
  async getStudentsByParentId(parentId) {
    return await this.studentRepository.findByParentId(parentId);
  }

  /**
   * Get students by class ID
   */
  async getStudentsByClassId(classId) {
    return await this.studentRepository.findByClassId(classId);
  }

  /**
   * Create a new student
   */
  async createStudent(studentData) {
    // Validate required fields
    if (!studentData.name || !studentData.parentId) {
      throw new ValidationError('Name and parent ID are required');
    }

    // Ensure classIds is an array
    if (!Array.isArray(studentData.classIds)) {
      throw new ValidationError('Class IDs must be an array');
    }

    return await this.studentRepository.createStudent(studentData);
  }

  /**
   * Update student
   */
  async updateStudent(id, studentData) {
    // Check if student exists
    await this.studentRepository.findById(id);

    // Validate required fields
    if (!studentData.name || !studentData.parentId) {
      throw new ValidationError('Name and parent ID are required');
    }

    // Ensure classIds is an array
    if (!Array.isArray(studentData.classIds)) {
      throw new ValidationError('Class IDs must be an array');
    }

    return await this.studentRepository.updateStudent(id, studentData);
  }

  /**
   * Delete student
   */
  async deleteStudent(id) {
    return await this.studentRepository.delete(id);
  }

  /**
   * Get at-risk students
   */
  async getAtRiskStudents() {
    return await this.studentRepository.findAtRiskStudents();
  }

  /**
   * Mark student as at-risk
   */
  async markAsAtRisk(id, atRisk = true) {
    const student = await this.studentRepository.findById(id);
    return await this.studentRepository.updateStudent(id, {
      ...student,
      atRisk
    });
  }

  /**
   * Update student attendance
   */
  async updateAttendance(id, attendance) {
    if (attendance < 0 || attendance > 100) {
      throw new ValidationError('Attendance must be between 0 and 100');
    }

    const student = await this.studentRepository.findById(id);
    return await this.studentRepository.updateStudent(id, {
      ...student,
      attendance
    });
  }
}

export default new StudentService(StudentRepository);

