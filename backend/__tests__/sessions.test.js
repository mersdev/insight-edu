/**
 * Sessions Table Tests
 */

import worker from '../src/worker.js';
import { createMockEnv, createMockContext, createToken } from './helpers/testUtils.js';

describe('Sessions API', () => {
  let mockEnv;
  let mockCtx;

  beforeEach(() => {
    mockEnv = createMockEnv();
    mockCtx = createMockContext();
  });

  describe('GET /api/v1/admin/sessions', () => {
    test('should get all sessions with valid token', async () => {
      const token = createToken();

      const request = new Request('http://localhost/api/v1/admin/sessions', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Scheduler + delete by month', () => {
    test('should create and delete sessions for a month', async () => {
      const token = createToken();

      const scheduleRequest = new Request('http://localhost/api/v1/admin/sessions/schedule', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ month: '2025-11' }),
      });

      const scheduleResponse = await worker.fetch(scheduleRequest, mockEnv, mockCtx);
      expect(scheduleResponse.status).toBe(200);
      const scheduleData = await scheduleResponse.json();
      expect(scheduleData.month).toBe('2025-11');
      expect(scheduleData.created).toBeGreaterThan(0);

      const fetchSessions = new Request('http://localhost/api/v1/admin/sessions', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const sessionsResponse = await worker.fetch(fetchSessions, mockEnv, mockCtx);
      const sessions = await sessionsResponse.json();
      const scheduledMonthSessions = sessions.filter((session) => session.date.startsWith('2025-11'));
      expect(scheduledMonthSessions.length).toBe(scheduleData.created);

      const deleteRequest = new Request('http://localhost/api/v1/admin/sessions/by-month', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ month: '2025-11' }),
      });
      const deleteResponse = await worker.fetch(deleteRequest, mockEnv, mockCtx);
      expect(deleteResponse.status).toBe(200);
      const deleteData = await deleteResponse.json();
      expect(deleteData.deleted).toBe(scheduleData.created);
      expect(deleteData.month).toBe('2025-11');

      const sessionsAfterDelete = await worker.fetch(fetchSessions, mockEnv, mockCtx);
      const sessionsDataAfterDelete = await sessionsAfterDelete.json();
      const remainingTargetMonth = sessionsDataAfterDelete.filter((session) => session.date.startsWith('2025-11'));
      expect(remainingTargetMonth.length).toBe(0);
    });
  });

  describe('Scheduler endpoint generation', () => {
    test('should generate sessions for requested month via endpoint', async () => {
      const token = createToken();

      const scheduleRequest = new Request('http://localhost/api/v1/admin/sessions/schedule', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ month: '2026-01' }),
      });

      const scheduleResponse = await worker.fetch(scheduleRequest, mockEnv, mockCtx);
      expect(scheduleResponse.status).toBe(200);
      const data = await scheduleResponse.json();
      expect(data.created).toBeGreaterThanOrEqual(0);
    });
  });
});
