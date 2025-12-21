/**
 * Users Table Tests
 */

import worker from '../src/worker.js';
import { createMockEnv, createMockContext, createToken } from './helpers/testUtils.js';

describe('Users API', () => {
  let mockEnv;
  let mockCtx;

  beforeEach(() => {
    mockEnv = createMockEnv();
    mockCtx = createMockContext();
  });

  describe('GET /api/v1/admin/users', () => {
    test('should get all users with valid token', async () => {
      const token = createToken();

      const request = new Request('http://localhost/api/v1/admin/users', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    test('should return 401 without auth token', async () => {
      const request = new Request('http://localhost/api/v1/admin/users', {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/admin/users', () => {
    test('should return 404 (endpoint removed)', async () => {
      const token = createToken();

      const request = new Request('http://localhost/api/v1/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: 'user2',
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
          role: 'TEACHER',
        }),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(404);
    });
  });

});
