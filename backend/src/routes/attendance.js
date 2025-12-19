/**
 * Attendance Routes
 * Handles attendance CRUD operations
 */

import express from 'express';
import { catchAsync } from '../middleware/errorHandler.js';
import AttendanceService from '../services/AttendanceService.js';

const router = express.Router();

/**
 * @swagger
 * /api/attendance:
 *   get:
 *     summary: Get all attendance records
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of attendance records
 *       401:
 *         description: Unauthorized
 */
router.get('/', catchAsync(async (req, res) => {
  const attendance = await AttendanceService.getAllAttendance();
  res.json(attendance);
}));

/**
 * @swagger
 * /api/attendance:
 *   post:
 *     summary: Record or update attendance
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *               studentId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [present, absent, late]
 *     responses:
 *       201:
 *         description: Attendance recorded
 *       401:
 *         description: Unauthorized
 */
router.post('/', catchAsync(async (req, res) => {
  const attendance = await AttendanceService.recordAttendance(req.body);
  res.status(201).json(attendance);
}));

export default router;

