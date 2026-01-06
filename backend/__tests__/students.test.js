/**
 * Students Table Tests
 */

import worker from '../src/worker.js';
import { createMockEnv, createMockContext, createToken } from './helpers/testUtils.js';
import { jest } from '@jest/globals';

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
      expect(aliAhmad.address).toBe('Jalan Cerdas, Taman Connaught, 56000 Kuala Lumpur');
    });
  });

  describe('POST /api/v1/admin/students', () => {
    test('should create a parent user that can login and trigger email', async () => {
      const token = createToken('admin', 'admin@edu.com', 'HQ');
      const studentId = `s_test_${Date.now()}`;
      const parentEmail = `testparent${Date.now()}@edu.com`;
      const address = 'Level 4, Demo Building, Kuala Lumpur';

      const newStudent = {
        id: studentId,
        name: 'Test Student',
        classIds: [],
        parentName: 'Test Parent',
        parentEmail,
        address,
        attendance: 100,
        atRisk: false,
      };

      const request = new Request('http://localhost/api/v1/admin/students', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(newStudent),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(201);
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('id');
      expect(responseBody).toHaveProperty('name', newStudent.name);
      expect(responseBody).toHaveProperty('address', address);

      const loginRequest = new Request('http://localhost/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: parentEmail,
          password: '123',
        }),
      });

      const loginResponse = await worker.fetch(loginRequest, mockEnv, mockCtx);
      expect(loginResponse.status).toBe(200);

      const loginData = await loginResponse.json();
      expect(loginData.user.email).toBe(parentEmail);
      expect(loginData.user.role).toBe('PARENT');
    });
  });

  describe('DELETE /api/v1/admin/students/:id', () => {
    test('should remove parent user when last student is deleted', async () => {
      const token = createToken('admin', 'admin@edu.com', 'HQ');
      const studentId = `s_delete_${Date.now()}`;
      const parentEmail = `parent${studentId.toLowerCase()}@edu.com`;

      const createRequest = new Request('http://localhost/api/v1/admin/students', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: studentId,
          name: 'Student To Delete',
          classIds: [],
          parentName: 'Delete Parent',
          parentEmail,
          attendance: 100,
          atRisk: false,
        }),
      });

      const createResponse = await worker.fetch(createRequest, mockEnv, mockCtx);
      expect(createResponse.status).toBe(201);

      const deleteRequest = new Request(`http://localhost/api/v1/admin/students/${studentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const deleteResponse = await worker.fetch(deleteRequest, mockEnv, mockCtx);
      expect(deleteResponse.status).toBe(204);

      const loginRequest = new Request('http://localhost/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: parentEmail,
          password: '123',
        }),
      });
      const loginResponse = await worker.fetch(loginRequest, mockEnv, mockCtx);
      expect(loginResponse.status).toBe(401);
    });
  });
});
