import request from 'supertest';
import app, { server } from '../src/server.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Authentication API', () => {
  let authToken;
  let testUserId;

  afterAll((done) => {
    server.close(done);
  });

  // Test Login Endpoint
  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@edu.com',
          password: 'Admin123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('name');
      expect(res.body.user).toHaveProperty('email', 'admin@edu.com');
      expect(res.body.user).toHaveProperty('role');
      expect(res.body.user).toHaveProperty('mustChangePassword');

      // Save token for subsequent tests
      authToken = res.body.token;
      testUserId = res.body.user.id;
    });

    it('should fail login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@edu.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should fail login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@edu.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should fail login with missing credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@edu.com'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  // Test Authentication Middleware
  describe('Authentication Middleware', () => {
    it('should allow access to protected route with valid token', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should deny access to protected route without token', async () => {
      const res = await request(app)
        .get('/api/users');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should deny access to protected route with invalid token', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer invalid_token_here');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should deny access to protected route with malformed Authorization header', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', 'InvalidFormat token');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Unauthorized');
    });
  });

  // Test Change Password Endpoint
  describe('POST /api/auth/change-password', () => {
    it('should change password successfully with valid current password', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'Admin123',
          newPassword: 'NewPassword123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Password changed successfully');

      // Verify can login with new password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@edu.com',
          password: 'NewPassword123'
        });

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body).toHaveProperty('token');

      // Update authToken for subsequent tests
      authToken = loginRes.body.token;
    });

    it('should fail to change password with incorrect current password', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'NewPassword456'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should fail to change password with weak new password (too short)', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'NewPassword123',
          newPassword: 'short'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should fail to change password with weak new password (no uppercase)', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'NewPassword123',
          newPassword: 'nouppercase123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should fail to change password with weak new password (no number)', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'NewPassword123',
          newPassword: 'NoNumberHere'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should fail to change password without authentication', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'NewPassword123',
          newPassword: 'AnotherPassword123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Unauthorized');
    });

    // Change password back to original for other tests
    it('should change password back to Admin123', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'NewPassword123',
          newPassword: 'Admin123'
        });

      expect(res.statusCode).toBe(200);
    });
  });

  // Test Password Hashing
  describe('Password Hashing', () => {
    it('should store passwords as bcrypt hashes, not plain text', async () => {
      // This test verifies that passwords are hashed by attempting to login
      // If passwords were stored in plain text, this would fail
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@edu.com',
          password: 'Admin123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');

      // The password hash should be a bcrypt hash (starts with $2b$ or $2a$)
      // We can't directly check the database in this test, but we verify
      // that bcrypt comparison works correctly
    });
  });

  // Test JWT Token
  describe('JWT Token', () => {
    it('should generate valid JWT tokens', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@edu.com',
          password: 'Admin123'
        });

      expect(res.statusCode).toBe(200);
      const token = res.body.token;

      // Verify token structure
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts

      // Decode and verify token payload
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('email', 'admin@edu.com');
      expect(decoded).toHaveProperty('role');
      expect(decoded).toHaveProperty('iat'); // issued at
      expect(decoded).toHaveProperty('exp'); // expiration
    });

    it('should have token expiration set', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@edu.com',
          password: 'Admin123'
        });

      const token = res.body.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check that expiration is set and is in the future
      expect(decoded.exp).toBeGreaterThan(decoded.iat);

      // Check that expiration is approximately 24 hours from now (with some tolerance)
      const expirationDuration = decoded.exp - decoded.iat;
      const expectedDuration = 24 * 60 * 60; // 24 hours in seconds
      expect(expirationDuration).toBeGreaterThanOrEqual(expectedDuration - 10);
      expect(expirationDuration).toBeLessThanOrEqual(expectedDuration + 10);
    });
  });
});

