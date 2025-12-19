/**
 * Settings Routes
 * Handles settings operations
 */

import express from 'express';
import { catchAsync } from '../middleware/errorHandler.js';
import SettingsService from '../services/SettingsService.js';

const router = express.Router();

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get application settings
 *     description: Retrieve current application settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dashboard_insight:
 *                   type: string
 *                   description: Dashboard insight text
 *                 last_analyzed:
 *                   type: string
 *                   format: date-time
 *                   description: Last analysis timestamp
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', catchAsync(async (req, res) => {
  const settings = await SettingsService.getSettings();
  res.json(settings);
}));

/**
 * @swagger
 * /api/settings:
 *   put:
 *     summary: Update application settings
 *     description: Update or create application settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dashboard_insight:
 *                 type: string
 *                 description: Dashboard insight text
 *               last_analyzed:
 *                 type: string
 *                 format: date-time
 *                 description: Last analysis timestamp
 *           example:
 *             dashboard_insight: Overall student performance is improving
 *             last_analyzed: 2024-01-15T10:30:00Z
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dashboard_insight:
 *                   type: string
 *                 last_analyzed:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/', catchAsync(async (req, res) => {
  const settings = await SettingsService.updateSettings(req.body);
  res.json(settings);
}));

export default router;

