/**
 * Locations Table Tests
 */

import worker from '../src/worker.js';
import { createMockEnv, createMockContext, createToken } from './helpers/testUtils.js';

describe('Locations API', () => {
  let mockEnv;
  let mockCtx;

  beforeEach(() => {
    mockEnv = createMockEnv();
    mockCtx = createMockContext();
  });

  describe('GET /api/v1/admin/locations', () => {
    test('should get all locations with valid token', async () => {
      const token = createToken();

      const request = new Request('http://localhost/api/v1/admin/locations', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test('should retrieve locations from seed data', async () => {
      const token = createToken('admin', 'admin@edu.com', 'HQ');

      const request = new Request('http://localhost/api/v1/admin/locations', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(4);

      const cheras = data.find((l) => l.id === 'l1');
      expect(cheras).toBeDefined();
      expect(cheras.name).toBe('Cheras');
      expect(cheras.address).toBe('Jalan Cerdas, Taman Connaught');
    });
  });

  describe('POST /api/v1/admin/locations', () => {
    test('should create a new location with valid token', async () => {
      const token = createToken();

      const request = new Request('http://localhost/api/v1/admin/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: 'loc1',
          name: 'Main Campus',
          address: '123 Main St',
        }),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(201);
    });
  });
});

