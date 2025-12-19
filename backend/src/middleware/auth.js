/**
 * Authentication Middleware
 * JWT-based authentication with improved error handling
 */

import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';

// Secret key for JWT - in production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Generate JWT token for a user
 */
export const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Authentication middleware
 * Validates JWT token and attaches user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      throw new AuthenticationError('Invalid or expired token');
    }

    // Fetch user from database to ensure they still exist
    const result = await pool.query(
      'SELECT id, name, email, role, must_change_password FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      throw new AuthenticationError('User not found');
    }

    // Attach user to request
    req.user = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware
 * @param {Array<string>} allowedRoles - Array of roles that can access the route
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AuthorizationError('You do not have permission to access this resource'));
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (decoded) {
      const result = await pool.query(
        'SELECT id, name, email, role, must_change_password FROM users WHERE id = $1',
        [decoded.id]
      );

      if (result.rows.length > 0) {
        req.user = result.rows[0];
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

