/**
 * Student Insights Routes
 * Handles student insight operations
 */

import express from 'express';
import { catchAsync } from '../middleware/errorHandler.js';
import StudentInsightService from '../services/StudentInsightService.js';

const router = express.Router();

/**
 * @swagger
 * /api/student-insights/{studentId}:
 *   get:
 *     summary: Get student insight by student ID
 *     tags: [Student Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student insight retrieved
 *       404:
 *         description: Insight not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:studentId', catchAsync(async (req, res) => {
  const insight = await StudentInsightService.getInsightByStudentId(req.params.studentId);
  res.json(insight);
}));

/**
 * @swagger
 * /api/student-insights:
 *   post:
 *     summary: Create or update student insight
 *     description: Save AI-generated insights for a student
 *     tags: [Student Insights]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentId:
 *                 type: string
 *               insight:
 *                 type: string
 *               generatedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Insight saved
 *       401:
 *         description: Unauthorized
 */
router.post('/', catchAsync(async (req, res) => {
  const insight = await StudentInsightService.saveInsight(req.body);
  res.status(201).json(insight);
}));

export default router;

