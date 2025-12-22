/**
 * Teachers Table Tests
 */

import worker from '../src/worker.js';
import { createMockEnv, createMockContext, createToken } from './helpers/testUtils.js';
import { jest } from '@jest/globals';

describe('Teachers API', () => {
  let mockEnv;
  let mockCtx;

  beforeEach(() => {
    mockEnv = createMockEnv();
    mockCtx = createMockContext();
    mockEnv.RESEND_CLIENT = {
      emails: { send: jest.fn().mockResolvedValue({ data: { id: 'mock-email' } }) },
      contacts: {
        create: jest.fn().mockResolvedValue({ data: { id: 'contact-teacher' } }),
        remove: jest.fn().mockResolvedValue({ data: { id: 'removed-teacher' } }),
      },
    };
  });

  describe('GET /api/v1/admin/teachers', () => {
    test('should get all teachers with valid token', async () => {
      const token = createToken();

      const request = new Request('http://localhost/api/v1/admin/teachers', {
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

      const request = new Request('http://localhost/api/v1/admin/teachers', {
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

  describe('POST /api/v1/admin/teachers', () => {
    test('should create a teacher user that can login and trigger email', async () => {
      const token = createToken('admin', 'admin@edu.com', 'HQ');
      const teacherId = `t_test_${Date.now()}`;
      const expectedEmail = `dehoulworker+testteacher${teacherId.toLowerCase().replace(/[^a-z0-9]+/g, '')}@gmail.com`;

      const request = new Request('http://localhost/api/v1/admin/teachers', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: teacherId,
          name: 'Test Teacher',
          email: expectedEmail,
          subject: 'Mathematics',
        }),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(201);

      const loginRequest = new Request('http://localhost/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: expectedEmail,
          password: '123',
        }),
      });

      const loginResponse = await worker.fetch(loginRequest, mockEnv, mockCtx);
      expect(loginResponse.status).toBe(200);

      const loginData = await loginResponse.json();
      expect(loginData.user.email).toBe(expectedEmail);
      expect(loginData.user.role).toBe('TEACHER');
      expect(mockEnv.RESEND_CLIENT.emails.send).toHaveBeenCalled();
      const emailPayload = mockEnv.RESEND_CLIENT.emails.send.mock.calls[0][0];
      expect(emailPayload.to[0]).toBe(expectedEmail);
      expect(mockEnv.RESEND_CLIENT.contacts.create).toHaveBeenCalled();
      const contactPayload = mockEnv.RESEND_CLIENT.contacts.create.mock.calls[0][0];
      expect(contactPayload.email).toBe(expectedEmail);
    });

    test('should remove Resend contact when deleting a teacher', async () => {
      const token = createToken('admin', 'admin@edu.com', 'HQ');
      const teacherId = `t_delete_${Date.now()}`;
      const expectedEmail = `dehoulworker+testteacher${teacherId.toLowerCase().replace(/[^a-z0-9]+/g, '')}@gmail.com`;

      const createRequest = new Request('http://localhost/api/v1/admin/teachers', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: teacherId,
          name: 'Delete Teacher',
          email: expectedEmail,
          subject: 'Mathematics',
        }),
      });

      const createResponse = await worker.fetch(createRequest, mockEnv, mockCtx);
      expect(createResponse.status).toBe(201);

      mockEnv.RESEND_CLIENT.contacts.remove.mockClear();

      const deleteRequest = new Request(`http://localhost/api/v1/admin/teachers/${teacherId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const deleteResponse = await worker.fetch(deleteRequest, mockEnv, mockCtx);
      expect(deleteResponse.status).toBe(204);
      expect(mockEnv.RESEND_CLIENT.contacts.remove).toHaveBeenCalledWith({ email: expectedEmail });
    });
  });
});
