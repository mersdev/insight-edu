/**
 * Teacher Routes
 * Handles teacher CRUD operations
 */

import express from 'express';
import { catchAsync } from '../middleware/errorHandler.js';
import { teacherValidation, idValidation } from '../middleware/validation.js';
import TeacherService from '../services/TeacherService.js';

const router = express.Router();

/**
 * @swagger
 * /api/teachers:
 *   get:
 *     summary: Get all teachers
 *     description: Retrieve a list of all teachers
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of teachers retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', catchAsync(async (req, res) => {
  const teachers = await TeacherService.getAllTeachers();
  res.json(teachers);
}));

/**
 * @swagger
 * /api/teachers/{id}:
 *   get:
 *     summary: Get teacher by ID
 *     description: Retrieve a specific teacher by their ID
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher ID
 *     responses:
 *       200:
 *         description: Teacher retrieved successfully
 *       404:
 *         description: Teacher not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', idValidation, catchAsync(async (req, res) => {
  const teacher = await TeacherService.getTeacherById(req.params.id);
  res.json(teacher);
}));

/**
 * @swagger
 * /api/teachers:
 *   post:
 *     summary: Create a new teacher
 *     description: Create a new teacher in the system
 *     tags: [Teachers]
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
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               locationId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Teacher created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', teacherValidation, catchAsync(async (req, res) => {
  const teacher = await TeacherService.createTeacher(req.body);
  res.status(201).json(teacher);
}));

/**
 * @swagger
 * /api/teachers/{id}:
 *   put:
 *     summary: Update a teacher
 *     description: Update an existing teacher's information
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               locationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Teacher updated successfully
 *       404:
 *         description: Teacher not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', idValidation, catchAsync(async (req, res) => {
  const teacher = await TeacherService.updateTeacher(req.params.id, req.body);
  res.json(teacher);
}));

/**
 * @swagger
 * /api/teachers/{id}:
 *   delete:
 *     summary: Delete a teacher
 *     description: Delete a teacher from the system
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher ID
 *     responses:
 *       204:
 *         description: Teacher deleted successfully
 *       404:
 *         description: Teacher not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', idValidation, catchAsync(async (req, res) => {
  await TeacherService.deleteTeacher(req.params.id);
  res.status(204).send();
}));

export default router;

