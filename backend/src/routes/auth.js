/**
 * Authentication Routes
 * Handles login and password management
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { loginValidation, changePasswordValidation } from '../middleware/validation.js';
import { catchAsync } from '../middleware/errorHandler.js';
import AuthService from '../services/AuthService.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email and password, returns JWT token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             hqUser:
 *               summary: HQ Admin Login
 *               value:
 *                 email: admin@insightedu.com
 *                 password: Admin123
 *             teacherUser:
 *               summary: Teacher Login
 *               value:
 *                 email: teacher@insightedu.com
 *                 password: Teacher123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             example:
 *               token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               user:
 *                 id: "1"
 *                 name: Admin User
 *                 email: admin@insightedu.com
 *                 role: HQ
 *                 mustChangePassword: false
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Validation Error
 *               message: Email and password are required
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Authentication Error
 *               message: Invalid email or password
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Too Many Requests
 *               message: Too many login attempts, please try again later
 */
router.post('/login', loginValidation, catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await AuthService.login(email, password);
  res.json(result);
}));

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     description: Get the current authenticated user's information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 mustChangePassword:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, catchAsync(async (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    mustChangePassword: req.user.must_change_password || false,
  });
}));

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password
 *     description: Change the password for the authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *           example:
 *             currentPassword: OldPassword123
 *             newPassword: NewPassword123
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: Password changed successfully
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               weakPassword:
 *                 summary: Weak password
 *                 value:
 *                   error: Validation Error
 *                   message: Password does not meet requirements
 *                   details:
 *                     - Password must be at least 8 characters long
 *                     - Password must contain at least one uppercase letter
 *                     - Password must contain at least one number
 *       401:
 *         description: Authentication error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               noToken:
 *                 summary: No token provided
 *                 value:
 *                   error: Authentication Error
 *                   message: No token provided
 *               invalidToken:
 *                 summary: Invalid token
 *                 value:
 *                   error: Authentication Error
 *                   message: Invalid or expired token
 *               wrongPassword:
 *                 summary: Wrong current password
 *                 value:
 *                   error: Authentication Error
 *                   message: Current password is incorrect
 */
router.post('/change-password', authenticate, changePasswordValidation, catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  const result = await AuthService.changePassword(userId, currentPassword, newPassword);
  res.json(result);
}));

export default router;

