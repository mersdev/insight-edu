/**
 * Class Routes
 * Handles class CRUD operations
 */

import express from 'express';
import { catchAsync } from '../middleware/errorHandler.js';
import { classValidation, idValidation } from '../middleware/validation.js';
import ClassService from '../services/ClassService.js';

const router = express.Router();

/**
 * @swagger
 * /api/classes:
 *   get:
 *     summary: Get all classes
 *     description: Retrieve a list of all classes
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of classes retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', catchAsync(async (req, res) => {
  const classes = await ClassService.getAllClasses();
  res.json(classes);
}));

/**
 * @swagger
 * /api/classes/{id}:
 *   get:
 *     summary: Get class by ID
 *     description: Retrieve a specific class by its ID
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class retrieved successfully
 *       404:
 *         description: Class not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', idValidation, catchAsync(async (req, res) => {
  const classData = await ClassService.getClassById(req.params.id);
  res.json(classData);
}));

/**
 * @swagger
 * /api/classes:
 *   post:
 *     summary: Create a new class
 *     description: Create a new class in the system
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - teacherId
 *             properties:
 *               name:
 *                 type: string
 *               teacherId:
 *                 type: string
 *               locationId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Class created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', classValidation, catchAsync(async (req, res) => {
  const classData = await ClassService.createClass(req.body);
  res.status(201).json(classData);
}));

/**
 * @swagger
 * /api/classes/{id}:
 *   put:
 *     summary: Update a class
 *     description: Update an existing class's information
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               teacherId:
 *                 type: string
 *               locationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Class updated successfully
 *       404:
 *         description: Class not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', idValidation, catchAsync(async (req, res) => {
  const classData = await ClassService.updateClass(req.params.id, req.body);
  res.json(classData);
}));

/**
 * @swagger
 * /api/classes/{id}:
 *   delete:
 *     summary: Delete a class
 *     description: Delete a class from the system
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     responses:
 *       204:
 *         description: Class deleted successfully
 *       404:
 *         description: Class not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', idValidation, catchAsync(async (req, res) => {
  await ClassService.deleteClass(req.params.id);
  res.status(204).send();
}));

export default router;

