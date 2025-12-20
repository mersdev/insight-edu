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

  describe('GET /api/teachers', () => {
    test('should get all teachers with valid token', async () => {
      const token = createToken();

      const request = new Request('http://localhost/api/teachers', {
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

      const request = new Request('http://localhost/api/teachers', {
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
});

