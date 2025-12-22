/**
 * Authentication Tests
 */

import worker from '../src/worker.js';
import { createMockEnv, createMockContext, createToken } from './helpers/testUtils.js';

describe('Authentication', () => {
  let mockEnv;
  let mockCtx;

  beforeEach(() => {
    mockEnv = createMockEnv();
    mockCtx = createMockContext();
  });

  describe('Login Endpoint', () => {
    test('should return 400 for missing email or password', async () => {
      const request = new Request('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(400);
    });

    test('should return 401 for invalid credentials', async () => {
      const request = new Request('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(401);
    });

    test('should login successfully with correct credentials', async () => {
      const request = new Request('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.token).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('test@example.com');
    });
  });

  describe('Seed Data Authentication', () => {
    test('should login successfully as HQ Admin with seed credentials', async () => {
      const request = new Request('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@edu.com',
          password: 'Admin123',
        }),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.token).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('admin@edu.com');
      expect(data.user.role).toBe('HQ');
      expect(data.user.name).toBe('HQ Admin');
    });

    test('should login successfully as Teacher with seed credentials', async () => {
      const request = new Request('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'dehoulworker+sarahjenkins@gmail.com',
          password: '123',
        }),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.token).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('dehoulworker+sarahjenkins@gmail.com');
      expect(data.user.role).toBe('TEACHER');
      expect(data.user.name).toBe('Sarah Jenkins');
    });

    test('should login successfully as Parent with seed credentials', async () => {
      const request = new Request('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'dehoulworker+ali@gmail.com',
          password: '123',
        }),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.token).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('dehoulworker+ali@gmail.com');
      expect(data.user.role).toBe('PARENT');
      expect(data.user.name).toBe('Mr. Ahmad');
    });

    test('should fail login with incorrect password', async () => {
      const request = new Request('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@edu.com',
          password: 'WrongPassword',
        }),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(401);
    });
  });

  describe('Token Validation', () => {
    test('should return 401 for missing auth token', async () => {
      const request = new Request('http://localhost/api/v1/admin/users', {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(401);
    });

    test('should return current user info for valid token', async () => {
      const token = createToken('admin', 'admin@edu.com', 'HQ');
      const request = new Request('http://localhost/api/v1/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.email).toBe('admin@edu.com');
      expect(data.role).toBe('HQ');
      expect(data.name).toBe('HQ Admin');
      expect(data.mustChangePassword).toBe(true);
    });
  });
});
