/**
 * StudentInsightService
 * Business logic for student insight operations
 */

import StudentInsightRepository from '../repositories/StudentInsightRepository.js';
import StudentRepository from '../repositories/StudentRepository.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

class StudentInsightService {
  /**
   * Get all student insights
   */
  async getAllInsights() {
    return await StudentInsightRepository.findAll();
  }

  /**
   * Get student insight by student ID
   */
  async getInsightByStudentId(studentId) {
    const insight = await StudentInsightRepository.findByStudentId(studentId);
    if (!insight) {
      throw new NotFoundError('Student insight not found');
    }
    return insight;
  }

  /**
   * Create or update student insight
   * If insight exists for student, update it; otherwise create new
   */
  async saveInsight(insightData) {
    const { studentId, insights, lastAnalyzed } = insightData;

    // Validate insight data
    this.validateInsightData(insightData);

    // Verify student exists
    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Check if insight already exists for this student
    const existingInsight = await StudentInsightRepository.findByStudentId(studentId);
    
    if (existingInsight) {
      // Update existing record
      return await StudentInsightRepository.updateInsight(studentId, { insights, lastAnalyzed });
    } else {
      // Create new record
      return await StudentInsightRepository.createInsight(insightData);
    }
  }

  /**
   * Update student insight
   */
  async updateInsight(studentId, insightData) {
    // Check if insight exists
    const existingInsight = await StudentInsightRepository.findByStudentId(studentId);
    if (!existingInsight) {
      throw new NotFoundError('Student insight not found');
    }

    return await StudentInsightRepository.updateInsight(studentId, insightData);
  }

  /**
   * Delete student insight
   */
  async deleteInsight(studentId) {
    const insight = await StudentInsightRepository.findByStudentId(studentId);
    if (!insight) {
      throw new NotFoundError('Student insight not found');
    }

    return await StudentInsightRepository.deleteInsight(studentId);
  }

  /**
   * Validate insight data
   */
  validateInsightData(data) {
    const errors = [];

    if (!data.studentId) {
      errors.push({ field: 'studentId', message: 'Student ID is required' });
    }

    if (!data.insights) {
      errors.push({ field: 'insights', message: 'Insights data is required' });
    }

    if (!data.lastAnalyzed) {
      errors.push({ field: 'lastAnalyzed', message: 'Last analyzed timestamp is required' });
    }

    if (errors.length > 0) {
      throw new ValidationError('Student insight validation failed', errors);
    }
  }
}

export default new StudentInsightService();

