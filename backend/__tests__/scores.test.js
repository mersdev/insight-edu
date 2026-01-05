/**
 * Scores Table Tests
 */

import worker from '../src/worker.js';
import { createMockEnv, createMockContext, createToken } from './helpers/testUtils.js';

describe('Scores API', () => {
  let mockEnv;
  let mockCtx;

  beforeEach(() => {
    mockEnv = createMockEnv();
    mockCtx = createMockContext();
  });

  describe('GET /api/v1/teacher/scores', () => {
    test('should get all scores with valid token', async () => {
      const token = createToken();

      const request = new Request('http://localhost/api/v1/teacher/scores', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('POST /api/v1/teacher/scores', () => {
    test('should create a score record and return it', async () => {
      const token = createToken('t1', 'sarahjenkins@edu.com', 'TEACHER');
      const newScore = {
        studentId: 's1',
        date: '2025-05-01',
        subject: 'Mathematics',
        value: 94,
        type: 'EXAM',
        teacherId: 't1',
      };

      const request = new Request('http://localhost/api/v1/teacher/scores', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newScore),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toMatchObject({
        studentId: newScore.studentId,
        subject: newScore.subject,
        value: newScore.value,
        type: newScore.type,
      });
    });
  });
});
