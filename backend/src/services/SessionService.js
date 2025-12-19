/**
 * SessionService
 * Business logic for session operations
 */

import SessionRepository from '../repositories/SessionRepository.js';
import ClassRepository from '../repositories/ClassRepository.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';

class SessionService {
  /**
   * Get all sessions
   */
  async getAllSessions() {
    return await SessionRepository.findAll();
  }

  /**
   * Get session by ID
   */
  async getSessionById(id) {
    const session = await SessionRepository.findById(id);
    if (!session) {
      throw new NotFoundError('Session not found');
    }
    return session;
  }

  /**
   * Get sessions by class ID
   */
  async getSessionsByClassId(classId) {
    return await SessionRepository.findByClassId(classId);
  }

  /**
   * Get sessions by date
   */
  async getSessionsByDate(date) {
    return await SessionRepository.findByDate(date);
  }

  /**
   * Get sessions by status
   */
  async getSessionsByStatus(status) {
    return await SessionRepository.findByStatus(status);
  }

  /**
   * Create a new session
   */
  async createSession(sessionData) {
    const { id, classId } = sessionData;

    // Validate session data
    this.validateSessionData(sessionData);

    // Check if session ID already exists
    const existingSession = await SessionRepository.findById(id);
    if (existingSession) {
      throw new ConflictError('Session with this ID already exists');
    }

    // Verify class exists
    const classExists = await ClassRepository.findById(classId);
    if (!classExists) {
      throw new NotFoundError('Class not found');
    }

    return await SessionRepository.createSession(sessionData);
  }

  /**
   * Update a session
   */
  async updateSession(id, sessionData) {
    // Check if session exists
    const existingSession = await SessionRepository.findById(id);
    if (!existingSession) {
      throw new NotFoundError('Session not found');
    }

    // Verify class exists if classId is being changed
    if (sessionData.classId && sessionData.classId !== existingSession.classId) {
      const classExists = await ClassRepository.findById(sessionData.classId);
      if (!classExists) {
        throw new NotFoundError('Class not found');
      }
    }

    return await SessionRepository.updateSession(id, sessionData);
  }

  /**
   * Update session status
   */
  async updateSessionStatus(id, status) {
    // Validate status
    const validStatuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid session status', [
        { field: 'status', message: `Status must be one of: ${validStatuses.join(', ')}` }
      ]);
    }

    // Check if session exists
    const session = await SessionRepository.findById(id);
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    return await SessionRepository.updateStatus(id, status);
  }

  /**
   * Delete a session
   */
  async deleteSession(id) {
    const session = await SessionRepository.findById(id);
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    return await SessionRepository.deleteSession(id);
  }

  /**
   * Validate session data
   */
  validateSessionData(data) {
    const errors = [];

    if (!data.id) {
      errors.push({ field: 'id', message: 'Session ID is required' });
    }

    if (!data.classId) {
      errors.push({ field: 'classId', message: 'Class ID is required' });
    }

    if (!data.date) {
      errors.push({ field: 'date', message: 'Session date is required' });
    }

    if (!data.startTime) {
      errors.push({ field: 'startTime', message: 'Start time is required' });
    }

    if (errors.length > 0) {
      throw new ValidationError('Session validation failed', errors);
    }
  }
}

export default new SessionService();

