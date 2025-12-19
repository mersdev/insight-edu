/**
 * Sync Routes
 * API endpoints for data synchronization operations
 */

import express from 'express';
import { catchAsync } from '../middleware/errorHandler.js';
import AttendanceSyncService from '../services/AttendanceSyncService.js';

const router = express.Router();

/**
 * @swagger
 * /api/sync/attendance:
 *   post:
 *     summary: Sync all student attendance records
 *     description: Updates the static attendance field for all students based on actual attendance records
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 results:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     updated:
 *                       type: number
 *                     errors:
 *                       type: array
 *       401:
 *         description: Unauthorized
 */
router.post('/attendance', catchAsync(async (req, res) => {
  const results = await AttendanceSyncService.syncAllStudents();
  res.json({
    message: 'Attendance sync completed',
    results
  });
}));

/**
 * @swagger
 * /api/sync/attendance/student/{studentId}:
 *   post:
 *     summary: Sync attendance for a specific student
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student attendance synced
 *       404:
 *         description: Student not found
 */
router.post('/attendance/student/:studentId', catchAsync(async (req, res) => {
  const { studentId } = req.params;
  const attendance = await AttendanceSyncService.syncStudentAttendance(studentId);
  res.json({
    message: 'Student attendance synced',
    studentId,
    attendance
  });
}));

/**
 * @swagger
 * /api/sync/attendance/class/{classId}:
 *   post:
 *     summary: Sync attendance for all students in a class
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Class attendance synced
 */
router.post('/attendance/class/:classId', catchAsync(async (req, res) => {
  const { classId } = req.params;
  const results = await AttendanceSyncService.syncClassAttendance(classId);
  res.json({
    message: 'Class attendance synced',
    classId,
    results
  });
}));

export default router;

