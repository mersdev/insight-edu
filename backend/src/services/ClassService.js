/**
 * ClassService
 * Business logic for class operations
 */

import ClassRepository from '../repositories/ClassRepository.js';
import TeacherRepository from '../repositories/TeacherRepository.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';

class ClassService {
  /**
   * Get all classes
   */
  async getAllClasses() {
    return await ClassRepository.findAll();
  }

  /**
   * Get class by ID
   */
  async getClassById(id) {
    const classData = await ClassRepository.findById(id);
    if (!classData) {
      throw new NotFoundError('Class not found');
    }
    return classData;
  }

  /**
   * Get classes by teacher ID
   */
  async getClassesByTeacherId(teacherId) {
    return await ClassRepository.findByTeacherId(teacherId);
  }

  /**
   * Get classes by location ID
   */
  async getClassesByLocationId(locationId) {
    return await ClassRepository.findByLocationId(locationId);
  }

  /**
   * Get classes by grade
   */
  async getClassesByGrade(grade) {
    return await ClassRepository.findByGrade(grade);
  }

  /**
   * Create a new class
   */
  async createClass(classData) {
    const { id, name, teacherId } = classData;

    // Validate class data
    this.validateClassData(classData);

    // Check if class ID already exists
    const existingClass = await ClassRepository.findById(id);
    if (existingClass) {
      throw new ConflictError('Class with this ID already exists');
    }

    // Check if class name already exists
    const nameExists = await ClassRepository.existsByName(name);
    if (nameExists) {
      throw new ConflictError('Class with this name already exists');
    }

    // Verify teacher exists if teacherId is provided
    if (teacherId) {
      const teacher = await TeacherRepository.findById(teacherId);
      if (!teacher) {
        throw new NotFoundError('Teacher not found');
      }
    }

    return await ClassRepository.createClass(classData);
  }

  /**
   * Update a class
   */
  async updateClass(id, classData) {
    // Check if class exists
    const existingClass = await ClassRepository.findById(id);
    if (!existingClass) {
      throw new NotFoundError('Class not found');
    }

    // Check if name is being changed and if it's already in use
    if (classData.name && classData.name !== existingClass.name) {
      const nameExists = await ClassRepository.existsByName(classData.name);
      if (nameExists) {
        throw new ConflictError('Class name already in use');
      }
    }

    // Verify teacher exists if teacherId is being changed
    if (classData.teacherId && classData.teacherId !== existingClass.teacherId) {
      const teacher = await TeacherRepository.findById(classData.teacherId);
      if (!teacher) {
        throw new NotFoundError('Teacher not found');
      }
    }

    return await ClassRepository.updateClass(id, classData);
  }

  /**
   * Delete a class
   */
  async deleteClass(id) {
    const classData = await ClassRepository.findById(id);
    if (!classData) {
      throw new NotFoundError('Class not found');
    }

    return await ClassRepository.deleteClass(id);
  }

  /**
   * Validate class data
   */
  validateClassData(data) {
    const errors = [];

    if (!data.id) {
      errors.push({ field: 'id', message: 'Class ID is required' });
    }

    if (!data.name) {
      errors.push({ field: 'name', message: 'Class name is required' });
    }

    if (errors.length > 0) {
      throw new ValidationError('Class validation failed', errors);
    }
  }
}

export default new ClassService();

