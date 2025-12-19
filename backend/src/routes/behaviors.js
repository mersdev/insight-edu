/**
 * Behavior Routes
 * Handles behavior CRUD operations
 */

import express from 'express';
import { catchAsync } from '../middleware/errorHandler.js';
import BehaviorService from '../services/BehaviorService.js';

const router = express.Router();

/**
 * @swagger
 * /api/behaviors:
 *   get:
 *     summary: Get all behavior records
 *     tags: [Behaviors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of behavior records
 *       401:
 *         description: Unauthorized
 */
router.get('/', catchAsync(async (req, res) => {
  const behaviors = await BehaviorService.getAllBehaviors();
  res.json(behaviors);
}));

/**
 * @swagger
 * /api/behaviors:
 *   post:
 *     summary: Record or update behavior
 *     tags: [Behaviors]
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
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Behavior recorded
 *       401:
 *         description: Unauthorized
 */
router.post('/', catchAsync(async (req, res) => {
  const behavior = await BehaviorService.recordBehavior(req.body);
  res.status(201).json(behavior);
}));

export default router;

