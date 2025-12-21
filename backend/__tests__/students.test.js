/**
 * Students Table Tests
 */

import worker from '../src/worker.js';
import { createMockEnv, createMockContext, createToken } from './helpers/testUtils.js';

describe('Students API', () => {
  let mockEnv;
  let mockCtx;

  beforeEach(() => {
    mockEnv = createMockEnv();
    mockCtx = createMockContext();
  });

  describe('GET /api/v1/admin/students', () => {
    test('should get all students with valid token', async () => {
      const token = createToken();

      const request = new Request('http://localhost/api/v1/admin/students', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test('should retrieve students from seed data', async () => {
      const token = createToken('admin', 'admin@edu.com', 'HQ');

      const request = new Request('http://localhost/api/v1/admin/students', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(2);

      const aliAhmad = data.find((s) => s.id === 's1');
      expect(aliAhmad).toBeDefined();
      expect(aliAhmad.name).toBe('Ali Ahmad');
      expect(aliAhmad.school).toBe('City High School');
    });
  });
});

