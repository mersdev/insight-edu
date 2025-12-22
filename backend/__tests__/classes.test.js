/**
 * Classes Table Tests
 */

import worker from '../src/worker.js';
import { createMockEnv, createMockContext, createToken } from './helpers/testUtils.js';

describe('Classes API', () => {
  let mockEnv;
  let mockCtx;

  beforeEach(() => {
    mockEnv = createMockEnv();
    mockCtx = createMockContext();
  });

  describe('GET /api/v1/admin/classes', () => {
    test('should get all classes with valid token', async () => {
      const token = createToken();

      const request = new Request('http://localhost/api/v1/admin/classes', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test('should retrieve classes from seed data', async () => {
      const token = createToken('admin', 'admin@edu.com', 'HQ');

      const request = new Request('http://localhost/api/v1/admin/classes', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(2);

      const mathClass = data.find((c) => c.id === 'c1');
      expect(mathClass).toBeDefined();
      expect(mathClass.name).toBe('Grade 10 Mathematics A');
      expect(mathClass.teacherId).toBe('t1');
      expect(mathClass.defaultSchedule).toEqual({ dayOfWeek: 'Monday', time: '09:00' });
    });
  });

  describe('POST /api/v1/admin/classes', () => {
    test('should create class and return parsed default schedule', async () => {
      const token = createToken('admin', 'admin@edu.com', 'HQ');
      const classId = `c_api_${Date.now()}`;

      const request = new Request('http://localhost/api/v1/admin/classes', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: classId,
          name: 'API Created Class',
          grade: '11',
          teacherId: 't1',
          locationId: 'l1',
          defaultSchedule: { dayOfWeek: 'Friday', time: '14:30' },
        }),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(201);
      const created = await response.json();
      expect(created.defaultSchedule).toEqual({ dayOfWeek: 'Friday', time: '14:30' });

      const getRequest = new Request(`http://localhost/api/v1/admin/classes/${classId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      const getResponse = await worker.fetch(getRequest, mockEnv, mockCtx);
      expect(getResponse.status).toBe(200);
      const persisted = await getResponse.json();
      expect(persisted.defaultSchedule).toEqual({ dayOfWeek: 'Friday', time: '14:30' });
    });

    test('should return a normalized default schedule when not provided', async () => {
      const token = createToken('admin', 'admin@edu.com', 'HQ');
      const classId = `c_api_${Date.now() + 1}`;

      const request = new Request('http://localhost/api/v1/admin/classes', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: classId,
          name: 'API Class Without Schedule',
          grade: '12',
          teacherId: 't1',
          locationId: 'l1',
        }),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(201);
      const created = await response.json();
      expect(created.defaultSchedule).toEqual({ dayOfWeek: null, time: null });

      const getRequest = new Request(`http://localhost/api/v1/admin/classes/${classId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      const getResponse = await worker.fetch(getRequest, mockEnv, mockCtx);
      expect(getResponse.status).toBe(200);
      const persisted = await getResponse.json();
      expect(persisted.defaultSchedule).toEqual({ dayOfWeek: null, time: null });
    });
  });
});
