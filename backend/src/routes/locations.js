/**
 * Location Routes
 * Handles location CRUD operations
 */

import express from 'express';
import { catchAsync } from '../middleware/errorHandler.js';
import { idValidation } from '../middleware/validation.js';
import LocationService from '../services/LocationService.js';

const router = express.Router();

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: Get all locations
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of locations
 *       401:
 *         description: Unauthorized
 */
router.get('/', catchAsync(async (req, res) => {
  const locations = await LocationService.getAllLocations();
  res.json(locations);
}));

/**
 * @swagger
 * /api/locations/{id}:
 *   get:
 *     summary: Get location by ID
 *     tags: [Locations]
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
 *         description: Location details
 *       404:
 *         description: Location not found
 */
router.get('/:id', idValidation, catchAsync(async (req, res) => {
  const location = await LocationService.getLocationById(req.params.id);
  res.json(location);
}));

/**
 * @swagger
 * /api/locations:
 *   post:
 *     summary: Create a new location
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Location created
 *       401:
 *         description: Unauthorized
 */
router.post('/', catchAsync(async (req, res) => {
  const location = await LocationService.createLocation(req.body);
  res.status(201).json(location);
}));

/**
 * PUT /api/locations/:id
 * Update a location
 */
router.put('/:id', idValidation, catchAsync(async (req, res) => {
  const location = await LocationService.updateLocation(req.params.id, req.body);
  res.json(location);
}));

/**
 * DELETE /api/locations/:id
 * Delete a location
 */
router.delete('/:id', idValidation, catchAsync(async (req, res) => {
  await LocationService.deleteLocation(req.params.id);
  res.status(204).send();
}));

export default router;

