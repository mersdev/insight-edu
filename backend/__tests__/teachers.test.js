/**
 * Teachers Table Tests
 */

import worker from '../src/worker.js';
import { createMockEnv, createMockContext, createToken } from './helpers/testUtils.js';

describe('Teachers API', () => {
  let mockEnv;
  let mockCtx;

  beforeEach(() => {
    mockEnv = createMockEnv();
    mockCtx = createMockContext();
  });

  describe('GET /api/v1/admin/teachers', () => {
    test('should get all teachers with valid token', async () => {
      const token = createToken();

      const request = new Request('http://localhost/api/v1/admin/teachers', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test('should retrieve teachers from seed data', async () => {
      const token = createToken('admin', 'admin@edu.com', 'HQ');

      const request = new Request('http://localhost/api/v1/admin/teachers', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(2);

      const sarah = data.find((t) => t.id === 't1');
      expect(sarah).toBeDefined();
      expect(sarah.name).toBe('Sarah Jenkins');
      expect(sarah.subject).toBe('Mathematics');
    });
  });

  describe('POST /api/v1/admin/teachers', () => {
    test('should create a teacher user that can login', async () => {
      const token = createToken('admin', 'admin@edu.com', 'HQ');
      const teacherId = `t_test_${Date.now()}`;
      const teacherEmail = `teacher.${Date.now()}@edu.com`;

      const request = new Request('http://localhost/api/v1/admin/teachers', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: teacherId,
          name: 'Test Teacher',
          email: teacherEmail,
          subject: 'Mathematics',
        }),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(201);

      const loginRequest = new Request('http://localhost/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: teacherEmail,
          password: '123',
        }),
      });

      const loginResponse = await worker.fetch(loginRequest, mockEnv, mockCtx);
      expect(loginResponse.status).toBe(200);

      const loginData = await loginResponse.json();
      expect(loginData.user.email).toBe(teacherEmail);
      expect(loginData.user.role).toBe('TEACHER');
    });
  });
});
