/**
 * BehaviorService
 * Business logic for behavior operations
 */

import BehaviorRepository from '../repositories/BehaviorRepository.js';
import SessionRepository from '../repositories/SessionRepository.js';
import StudentRepository from '../repositories/StudentRepository.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

class BehaviorService {
  /**
   * Get all behavior records
   */
  async getAllBehaviors() {
    return await BehaviorRepository.findAll();
  }

  /**
   * Get behaviors by student ID
   */
  async getBehaviorsByStudentId(studentId) {
    return await BehaviorRepository.findByStudentId(studentId);
  }

  /**
   * Get behaviors by session ID
   */
  async getBehaviorsBySessionId(sessionId) {
    return await BehaviorRepository.findBySessionId(sessionId);
  }

  /**
   * Get behaviors by category
   */
  async getBehaviorsByCategory(category) {
    return await BehaviorRepository.findByCategory(category);
  }

  /**
   * Record or update behavior
   * If behavior exists for student/session/category, update it; otherwise create new
   */
  async recordBehavior(behaviorData) {
    const { studentId, sessionId, date, category, rating } = behaviorData;

    // Validate behavior data
    this.validateBehaviorData(behaviorData);

    // Verify student exists
    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Verify session exists if sessionId is provided
    if (sessionId) {
      const session = await SessionRepository.findById(sessionId);
      if (!session) {
        throw new NotFoundError('Session not found');
      }

      // Check if behavior already exists for this student/session/category
      const existingBehavior = await BehaviorRepository.findByStudentSessionCategory(
        studentId, 
        sessionId, 
        category
      );

      if (existingBehavior) {
        // Update existing record
        return await BehaviorRepository.updateBehavior(studentId, sessionId, category, { rating, date });
      }
    }

    // Create new record
    return await BehaviorRepository.createBehavior(behaviorData);
  }

  /**
   * Update behavior record
   */
  async updateBehavior(studentId, sessionId, category, behaviorData) {
    // Check if behavior exists
    const existingBehavior = await BehaviorRepository.findByStudentSessionCategory(
      studentId, 
      sessionId, 
      category
    );
    
    if (!existingBehavior) {
      throw new NotFoundError('Behavior record not found');
    }

    return await BehaviorRepository.updateBehavior(studentId, sessionId, category, behaviorData);
  }

  /**
   * Delete behavior record
   */
  async deleteBehavior(studentId, sessionId, category) {
    const behavior = await BehaviorRepository.findByStudentSessionCategory(
      studentId, 
      sessionId, 
      category
    );
    
    if (!behavior) {
      throw new NotFoundError('Behavior record not found');
    }

    return await BehaviorRepository.deleteBehavior(studentId, sessionId, category);
  }

  /**
   * Validate behavior data
   */
  validateBehaviorData(data) {
    const errors = [];

    if (!data.studentId) {
      errors.push({ field: 'studentId', message: 'Student ID is required' });
    }

    if (!data.category) {
      errors.push({ field: 'category', message: 'Behavior category is required' });
    }

    if (data.rating === undefined || data.rating === null) {
      errors.push({ field: 'rating', message: 'Behavior rating is required' });
    }

    // Validate rating range (typically 1-5)
    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
      errors.push({ field: 'rating', message: 'Rating must be between 1 and 5' });
    }

    if (!data.date) {
      errors.push({ field: 'date', message: 'Date is required' });
    }

    if (errors.length > 0) {
      throw new ValidationError('Behavior validation failed', errors);
    }
  }
}

export default new BehaviorService();

