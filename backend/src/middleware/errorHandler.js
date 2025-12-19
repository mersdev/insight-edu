/**
 * Global Error Handling Middleware
 * Centralized error handling following industry best practices
 */

import { AppError } from '../utils/errors.js';

/**
 * Development error response - includes stack trace
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
    ...(err.errors && { errors: err.errors })
  });
};

/**
 * Map status code to error type string
 */
const getErrorType = (statusCode) => {
  const errorTypes = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    500: 'Internal Server Error',
    503: 'Service Unavailable'
  };
  return errorTypes[statusCode] || 'Error';
};

/**
 * Production error response - sanitized
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      error: getErrorType(err.statusCode),
      status: err.status,
      message: err.message,
      ...(err.errors && { errors: err.errors })
    });
  } else {
    // Programming or unknown error: don't leak error details
    console.error('ERROR 💥', err);
    res.status(500).json({
      error: 'Internal Server Error',
      status: 'error',
      message: 'Something went wrong!'
    });
  }
};

/**
 * Handle PostgreSQL errors
 */
const handleDatabaseError = (err) => {
  // Unique constraint violation
  if (err.code === '23505') {
    return new AppError('Duplicate entry. This record already exists.', 409, true);
  }
  
  // Foreign key violation
  if (err.code === '23503') {
    return new AppError('Referenced record does not exist.', 400, true);
  }
  
  // Not null violation
  if (err.code === '23502') {
    return new AppError(`Required field missing: ${err.column}`, 400, true);
  }
  
  // Default database error
  return new AppError('Database operation failed.', 500, false);
};

/**
 * Handle JWT errors
 */
const handleJWTError = () => 
  new AppError('Invalid token. Please log in again.', 401, true);

const handleJWTExpiredError = () => 
  new AppError('Your token has expired. Please log in again.', 401, true);

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    error.isOperational = err.isOperational;

    // Handle specific error types
    if (err.code && err.code.startsWith('23')) error = handleDatabaseError(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

/**
 * Async error wrapper - catches errors in async route handlers
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res, next) => {
  const err = new AppError(`Cannot find ${req.originalUrl} on this server`, 404, true);
  next(err);
};

