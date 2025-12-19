/**
 * Score Routes
 * Handles score CRUD operations
 */

import express from 'express';
import { catchAsync } from '../middleware/errorHandler.js';
import ScoreService from '../services/ScoreService.js';

const router = express.Router();

/**
 * @swagger
 * /api/scores:
 *   get:
 *     summary: Get all scores
 *     tags: [Scores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of scores
 *       401:
 *         description: Unauthorized
 */
router.get('/', catchAsync(async (req, res) => {
  const scores = await ScoreService.getAllScores();
  res.json(scores);
}));

/**
 * @swagger
 * /api/scores:
 *   post:
 *     summary: Record or update score
 *     tags: [Scores]
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
 *               score:
 *                 type: number
 *               maxScore:
 *                 type: number
 *     responses:
 *       201:
 *         description: Score recorded
 *       401:
 *         description: Unauthorized
 */
router.post('/', catchAsync(async (req, res) => {
  const score = await ScoreService.recordScore(req.body);
  res.status(201).json(score);
}));

export default router;

