/**
 * CORS and Error Handling Tests
 */

import worker from '../src/worker.js';
import { createMockEnv, createMockContext, createToken } from './helpers/testUtils.js';

describe('CORS and Error Handling', () => {
  let mockEnv;
  let mockCtx;

  beforeEach(() => {
    mockEnv = createMockEnv();
    mockCtx = createMockContext();
  });

  describe('CORS', () => {
    test('should handle CORS preflight requests', async () => {
      const request = new Request('http://localhost/api/users', {
        method: 'OPTIONS',
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for unknown routes', async () => {
      const token = createToken();

      const request = new Request('http://localhost/api/unknown', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(404);
    });
  });
});

