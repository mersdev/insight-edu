/**
 * Session Routes
 * Handles session CRUD operations
 */

import express from 'express';
import { catchAsync } from '../middleware/errorHandler.js';
import { sessionValidation, idValidation } from '../middleware/validation.js';
import SessionService from '../services/SessionService.js';

const router = express.Router();

/**
 * @swagger
 * /api/sessions:
 *   get:
 *     summary: Get all sessions
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sessions
 *       401:
 *         description: Unauthorized
 */
router.get('/', catchAsync(async (req, res) => {
  const sessions = await SessionService.getAllSessions();
  res.json(sessions);
}));

/**
 * @swagger
 * /api/sessions/{id}:
 *   get:
 *     summary: Get session by ID
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session details
 *       404:
 *         description: Session not found
 */
router.get('/:id', idValidation, catchAsync(async (req, res) => {
  const session = await SessionService.getSessionById(req.params.id);
  res.json(session);
}));

/**
 * @swagger
 * /api/sessions:
 *   post:
 *     summary: Create a new session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               classId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *     responses:
 *       201:
 *         description: Session created
 *       401:
 *         description: Unauthorized
 */
router.post('/', sessionValidation, catchAsync(async (req, res) => {
  const session = await SessionService.createSession(req.body);
  res.status(201).json(session);
}));

/**
 * PUT /api/sessions/:id
 * Update a session
 */
router.put('/:id', idValidation, catchAsync(async (req, res) => {
  const session = await SessionService.updateSession(req.params.id, req.body);
  res.json(session);
}));

/**
 * PUT /api/sessions/:id/status
 * Update session status
 */
router.put('/:id/status', idValidation, catchAsync(async (req, res) => {
  const { status } = req.body;
  const session = await SessionService.updateSessionStatus(req.params.id, status);
  res.json(session);
}));

/**
 * DELETE /api/sessions/:id
 * Delete a session
 */
router.delete('/:id', idValidation, catchAsync(async (req, res) => {
  await SessionService.deleteSession(req.params.id);
  res.status(204).send();
}));

export default router;

