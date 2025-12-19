/**
 * Validation Middleware using express-validator
 * Provides reusable validation rules and error handling
 */

import { body, param, validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors.js';

/**
 * Middleware to check validation results
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));
    throw new ValidationError('Validation failed', errorMessages);
  }
  next();
};

/**
 * Login validation rules
 */
export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

/**
 * Password validation rules
 */
export const passwordValidation = [
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  validate
];

/**
 * Change password validation
 */
export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  ...passwordValidation
];

/**
 * Student validation rules
 */
export const studentValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Student name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('parent_id')
    .notEmpty()
    .withMessage('Parent ID is required'),
  body('class_ids')
    .isArray()
    .withMessage('Class IDs must be an array'),
  body('school')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('School name must not exceed 200 characters'),
  body('parent_email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid parent email')
    .normalizeEmail(),
  body('emergency_contact')
    .optional()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  validate
];

/**
 * Teacher validation rules
 */
export const teacherValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Teacher name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('subject')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Subject must not exceed 100 characters'),
  body('phone')
    .optional()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  validate
];

/**
 * Class validation rules
 */
export const classValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Class name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('teacherId')
    .notEmpty()
    .withMessage('Teacher ID is required'),
  body('locationId')
    .notEmpty()
    .withMessage('Location ID is required'),
  body('grade')
    .optional()
    .trim(),
  validate
];

/**
 * Session validation rules
 */
export const sessionValidation = [
  body('classId')
    .notEmpty()
    .withMessage('Class ID is required'),
  body('date')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid time in HH:MM format'),
  body('type')
    .isIn(['REGULAR', 'MAKEUP', 'TRIAL'])
    .withMessage('Type must be REGULAR, MAKEUP, or TRIAL'),
  body('status')
    .optional()
    .isIn(['SCHEDULED', 'COMPLETED', 'CANCELLED'])
    .withMessage('Status must be SCHEDULED, COMPLETED, or CANCELLED'),
  validate
];

/**
 * ID parameter validation
 */
export const idValidation = [
  param('id')
    .notEmpty()
    .withMessage('ID is required'),
  validate
];

