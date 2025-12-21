/**
 * Settings Table Tests
 */

import worker from '../src/worker.js';
import { createMockEnv, createMockContext, createToken } from './helpers/testUtils.js';

describe('Settings API', () => {
  let mockEnv;
  let mockCtx;

  beforeEach(() => {
    mockEnv = createMockEnv();
    mockCtx = createMockContext();
  });

  describe('GET /api/v1/admin/settings', () => {
    test('should get settings with valid token', async () => {
      const token = createToken();

      const request = new Request('http://localhost/api/v1/admin/settings', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.dashboard_insight).toBeDefined();
    });
  });
});

