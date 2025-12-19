/**
 * ScoreService
 * Business logic for score operations
 */

import ScoreRepository from '../repositories/ScoreRepository.js';
import StudentRepository from '../repositories/StudentRepository.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

class ScoreService {
  /**
   * Get all scores
   */
  async getAllScores() {
    return await ScoreRepository.findAll();
  }

  /**
   * Get scores by student ID
   */
  async getScoresByStudentId(studentId) {
    return await ScoreRepository.findByStudentId(studentId);
  }

  /**
   * Get scores by subject
   */
  async getScoresBySubject(subject) {
    return await ScoreRepository.findBySubject(subject);
  }

  /**
   * Get scores by type
   */
  async getScoresByType(type) {
    return await ScoreRepository.findByType(type);
  }

  /**
   * Get scores by student and subject
   */
  async getScoresByStudentAndSubject(studentId, subject) {
    return await ScoreRepository.findByStudentAndSubject(studentId, subject);
  }

  /**
   * Create or update score
   */
  async recordScore(scoreData) {
    // Validate score data
    this.validateScoreData(scoreData);

    const { studentId, date, subject } = scoreData;

    // Verify student exists
    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Check if score already exists for this student/date/subject
    const existingScore = await ScoreRepository.findByStudentDateSubject(studentId, date, subject);
    
    if (existingScore) {
      // Update existing record
      return await ScoreRepository.updateScore(studentId, date, subject, scoreData);
    } else {
      // Create new record
      return await ScoreRepository.createScore(scoreData);
    }
  }

  /**
   * Update score
   */
  async updateScore(studentId, date, subject, scoreData) {
    // Check if score exists
    const existingScore = await ScoreRepository.findByStudentDateSubject(studentId, date, subject);
    if (!existingScore) {
      throw new NotFoundError('Score record not found');
    }

    return await ScoreRepository.updateScore(studentId, date, subject, scoreData);
  }

  /**
   * Delete score
   */
  async deleteScore(studentId, date, subject) {
    const score = await ScoreRepository.findByStudentDateSubject(studentId, date, subject);
    if (!score) {
      throw new NotFoundError('Score record not found');
    }

    return await ScoreRepository.deleteScore(studentId, date, subject);
  }

  /**
   * Validate score data
   */
  validateScoreData(data) {
    const errors = [];

    if (!data.studentId) {
      errors.push({ field: 'studentId', message: 'Student ID is required' });
    }

    if (!data.date) {
      errors.push({ field: 'date', message: 'Date is required' });
    }

    if (!data.subject || data.subject.trim() === '') {
      errors.push({ field: 'subject', message: 'Subject is required' });
    }

    if (data.value === undefined || data.value === null) {
      errors.push({ field: 'value', message: 'Score value is required' });
    }

    // Validate score value (typically 0-100)
    if (data.value !== undefined && (data.value < 0 || data.value > 100)) {
      errors.push({ field: 'value', message: 'Score value must be between 0 and 100' });
    }

    if (!data.type) {
      errors.push({ field: 'type', message: 'Score type is required' });
    }

    if (errors.length > 0) {
      throw new ValidationError('Score validation failed', errors);
    }
  }
}

export default new ScoreService();

