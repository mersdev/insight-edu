/**
 * Health Endpoint Tests
 */

import worker from '../src/worker.js';
import { createMockEnv, createMockContext } from './helpers/testUtils.js';

describe('Health Endpoint', () => {
  let mockEnv;
  let mockCtx;

  beforeEach(() => {
    mockEnv = createMockEnv();
    mockCtx = createMockContext();
  });

  test('should return ok for API health check', async () => {
    const request = new Request('http://localhost/api/v1/health');
    const response = await worker.fetch(request, mockEnv, mockCtx);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.message).toBe('Server is running');
  });

  test('should return ok for root health check', async () => {
    const request = new Request('http://localhost/health');
    const response = await worker.fetch(request, mockEnv, mockCtx);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('ok');
  });
});
