/**
 * Test Utilities
 */

import jwt from 'jsonwebtoken';
import { MockD1 } from './mockD1.js';

export function createMockEnv() {
  return {
    DB: new MockD1(),
    JWT_SECRET: 'test-secret-key',
  };
}

export function createMockContext() {
  return {};
}

export function createToken(userId = 'user1', email = 'test@example.com', role = 'TEACHER') {
  return jwt.sign(
    { id: userId, email, role },
    'test-secret-key',
    { expiresIn: '24h' }
  );
}

export function createRequest(url, options = {}) {
  return new Request(url, options);
}

