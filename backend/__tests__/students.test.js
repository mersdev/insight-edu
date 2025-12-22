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
    mockEnv.RESEND_CLIENT = { emails: { send: jest.fn().mockResolvedValue({ data: { id: 'mock-email' } }) } };
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

  describe('POST /api/v1/admin/students', () => {
    test('should create a parent user that can login and trigger email', async () => {
      const token = createToken('admin', 'admin@edu.com', 'HQ');
      const studentId = `s_test_${Date.now()}`;

      const parentEmail = `dehoulworker+testparent${Date.now()}@gmail.com`;

      const request = new Request('http://localhost/api/v1/admin/students', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: studentId,
          name: 'Test Student',
          classIds: [],
          parentName: 'Test Parent',
          parentEmail,
          attendance: 100,
          atRisk: false,
        }),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(201);

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
      expect(mockEnv.RESEND_CLIENT.emails.send).toHaveBeenCalled();
      const emailPayload = mockEnv.RESEND_CLIENT.emails.send.mock.calls[0][0];
      expect(emailPayload.to[0]).toBe(parentEmail);
    });
  });

  describe('POST /api/v1/teacher/students/:id/report-email', () => {
    test('should send student report email via Resend', async () => {
      const token = createToken('u_t1', 'dehoulworker+sarahjenkins@gmail.com', 'TEACHER');
      const sendSpy = jest.fn().mockResolvedValue({ data: { id: 'report-email' } });
      mockEnv.RESEND_CLIENT = { emails: { send: sendSpy } };

      const request = new Request('http://localhost/api/v1/teacher/students/s1/report-email', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: 'Summary body' }),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(200);

      expect(sendSpy).toHaveBeenCalled();
      const payload = sendSpy.mock.calls[0][0];
      expect(payload.to[0]).toBe('dehoulworker+ali@gmail.com');
      expect(payload.subject).toContain('Student Report');
    });
  });
});
