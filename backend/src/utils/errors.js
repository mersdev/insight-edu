/**
 * Custom Error Classes for better error handling
 * Following industry best practices for error management
 */

/**
 * Base Application Error
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error - 400
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

/**
 * Authentication Error - 401
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

/**
 * Authorization Error - 403
 */
export class AuthorizationError extends AppError {
  constructor(message = 'You do not have permission to access this resource') {
    super(message, 403);
  }
}

/**
 * Not Found Error - 404
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

/**
 * Conflict Error - 409
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}

/**
 * Database Error - 500
 */
export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, 500);
    this.originalError = originalError;
  }
}

/**
 * External Service Error - 502
 */
export class ExternalServiceError extends AppError {
  constructor(service = 'External service', message = 'Service unavailable') {
    super(`${service}: ${message}`, 502);
  }
}

