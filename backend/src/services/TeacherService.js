/**
 * TeacherService
 * Business logic for teacher operations
 */

import bcrypt from 'bcrypt';
import TeacherRepository from '../repositories/TeacherRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';

const SALT_ROUNDS = 10;

class TeacherService {
  /**
   * Get all teachers
   */
  async getAllTeachers() {
    return await TeacherRepository.findAll();
  }

  /**
   * Get teacher by ID
   */
  async getTeacherById(id) {
    const teacher = await TeacherRepository.findById(id);
    if (!teacher) {
      throw new NotFoundError('Teacher not found');
    }
    return teacher;
  }

  /**
   * Get teachers by subject
   */
  async getTeachersBySubject(subject) {
    return await TeacherRepository.findBySubject(subject);
  }

  /**
   * Create a new teacher
   * Also creates a user account if email is provided
   */
  async createTeacher(teacherData) {
    const { id, email } = teacherData;

    // Check if teacher ID already exists
    const existingTeacher = await TeacherRepository.findById(id);
    if (existingTeacher) {
      throw new ConflictError('Teacher with this ID already exists');
    }

    // Check if email already exists
    if (email) {
      const emailExists = await TeacherRepository.existsByEmail(email);
      if (emailExists) {
        throw new ConflictError('Teacher with this email already exists');
      }
    }

    // Begin transaction
    const client = await TeacherRepository.beginTransaction();
    
    try {
      // Create teacher
      const teacher = await TeacherRepository.createTeacher(teacherData);

      // Auto-create user account if email is provided
      if (email) {
        const userExists = await UserRepository.findByEmail(email);
        if (!userExists) {
          // Generate default password and hash it
          const defaultPassword = '123';
          const passwordHash = await bcrypt.hash(defaultPassword, SALT_ROUNDS);

          await UserRepository.create({
            id: `u_${id}`,
            name: teacherData.name,
            email: email,
            password: defaultPassword,
            password_hash: passwordHash,
            role: 'TEACHER',
            must_change_password: true
          });
        }
      }

      await TeacherRepository.commitTransaction(client);
      return teacher;
    } catch (error) {
      await TeacherRepository.rollbackTransaction(client);
      throw error;
    }
  }

  /**
   * Update a teacher
   */
  async updateTeacher(id, teacherData) {
    // Check if teacher exists
    const existingTeacher = await TeacherRepository.findById(id);
    if (!existingTeacher) {
      throw new NotFoundError('Teacher not found');
    }

    // Check if email is being changed and if it's already in use
    if (teacherData.email && teacherData.email !== existingTeacher.email) {
      const emailExists = await TeacherRepository.existsByEmail(teacherData.email);
      if (emailExists) {
        throw new ConflictError('Email already in use by another teacher');
      }
    }

    return await TeacherRepository.updateTeacher(id, teacherData);
  }

  /**
   * Delete a teacher
   */
  async deleteTeacher(id) {
    const teacher = await TeacherRepository.findById(id);
    if (!teacher) {
      throw new NotFoundError('Teacher not found');
    }

    return await TeacherRepository.deleteTeacher(id);
  }

  /**
   * Validate teacher data
   */
  validateTeacherData(data) {
    const errors = [];

    if (!data.id) {
      errors.push({ field: 'id', message: 'Teacher ID is required' });
    }

    if (!data.name) {
      errors.push({ field: 'name', message: 'Teacher name is required' });
    }

    if (data.email && !this.isValidEmail(data.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }

    if (errors.length > 0) {
      throw new ValidationError('Teacher validation failed', errors);
    }
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export default new TeacherService();

