import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/database.js';
import { catchAsync } from '../middleware/errorHandler.js';
import { studentValidation, idValidation } from '../middleware/validation.js';

const router = express.Router();
const SALT_ROUNDS = 10;

/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: Get all students
 *     description: Retrieve a list of all students
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of students retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', catchAsync(async (req, res) => {
  const result = await pool.query('SELECT * FROM students ORDER BY id');
  const students = result.rows.map(row => ({
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    classIds: row.class_ids,
    attendance: row.attendance,
    atRisk: row.at_risk,
    school: row.school,
    parentName: row.parent_name,
    relationship: row.relationship,
    emergencyContact: row.emergency_contact,
    parentEmail: row.parent_email
  }));
  res.json(students);
}));

/**
 * @swagger
 * /api/students:
 *   post:
 *     summary: Create a new student
 *     description: Create a new student and optionally auto-create parent account
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - name
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               parentId:
 *                 type: string
 *               classIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               attendance:
 *                 type: number
 *               atRisk:
 *                 type: boolean
 *               school:
 *                 type: string
 *               parentName:
 *                 type: string
 *               relationship:
 *                 type: string
 *               emergencyContact:
 *                 type: string
 *               parentEmail:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: Student created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', studentValidation, catchAsync(async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id, name, parent_id, class_ids, attendance, at_risk, school, parent_name, relationship, emergency_contact, parent_email } = req.body;

    // Insert student
    const studentResult = await client.query(
      `INSERT INTO students (id, name, parent_id, class_ids, attendance, at_risk, school, parent_name, relationship, emergency_contact, parent_email)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [id, name, parent_id, JSON.stringify(class_ids), attendance, at_risk, school, parent_name, relationship, emergency_contact, parent_email]
    );

    // Auto-create parent user account if email is provided
    if (parent_email) {
      const userCheck = await client.query('SELECT * FROM users WHERE email = $1', [parent_email]);
      if (userCheck.rows.length === 0) {
        // Generate default password and hash it
        const defaultPassword = '123';
        const passwordHash = await bcrypt.hash(defaultPassword, SALT_ROUNDS);

        await client.query(
          'INSERT INTO users (id, name, email, password, password_hash, role, must_change_password) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [`u_p_${id}`, parent_name || 'Parent', parent_email, defaultPassword, passwordHash, 'PARENT', true]
        );
      }
    }

    await client.query('COMMIT');

    const row = studentResult.rows[0];
    res.status(201).json({
      id: row.id,
      name: row.name,
      parentId: row.parent_id,
      classIds: row.class_ids,
      attendance: row.attendance,
      atRisk: row.at_risk,
      school: row.school,
      parentName: row.parent_name,
      relationship: row.relationship,
      emergencyContact: row.emergency_contact,
      parentEmail: row.parent_email
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

// PUT /api/students/:id
router.put('/:id', idValidation, catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, parent_id, class_ids, attendance, at_risk, school, parent_name, relationship, emergency_contact, parent_email } = req.body;

  const result = await pool.query(
    `UPDATE students SET name = $1, parent_id = $2, class_ids = $3, attendance = $4, at_risk = $5,
     school = $6, parent_name = $7, relationship = $8, emergency_contact = $9, parent_email = $10
     WHERE id = $11 RETURNING *`,
    [name, parent_id, JSON.stringify(class_ids), attendance, at_risk, school, parent_name, relationship, emergency_contact, parent_email, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const row = result.rows[0];
  res.json({
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    classIds: row.class_ids,
    attendance: row.attendance,
    atRisk: row.at_risk,
    school: row.school,
    parentName: row.parent_name,
    relationship: row.relationship,
    emergencyContact: row.emergency_contact,
    parentEmail: row.parent_email
  });
}));

// DELETE /api/students/:id
router.delete('/:id', idValidation, catchAsync(async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM students WHERE id = $1', [id]);
  res.status(204).send();
}));

export default router;

