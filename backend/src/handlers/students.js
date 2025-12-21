import bcrypt from 'bcryptjs';
import { jsonResponse } from '../utils/response.js';
import { toCamelCase, toCamelCaseArray } from '../utils/casing.js';

const DEFAULT_PASSWORD = '123';
const SALT_ROUNDS = 10;

export async function handleGetStudents({ db, corsHeaders }) {
  try {
    const students = await db
      .prepare('SELECT * FROM students ORDER BY id')
      .all();

    return jsonResponse(toCamelCaseArray(students.results || []), 200, corsHeaders);
  } catch (error) {
    console.error('Get students error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleCreateStudent({ body, db, corsHeaders }) {
  try {
    const {
      id,
      name,
      parentId,
      classIds,
      attendance,
      atRisk,
      school,
      parentName,
      relationship,
      emergencyContact,
      parentEmail,
    } = body;

    if (!id || !name) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Missing required fields' },
        400,
        corsHeaders
      );
    }

    const trimmedParentEmail = parentEmail?.trim();
    let resolvedParentId = parentId || null;

    if (trimmedParentEmail) {
      const existingUser = await db
        .prepare('SELECT id, role FROM users WHERE email = ?')
        .bind(trimmedParentEmail)
        .first();

      if (existingUser && existingUser.role !== 'PARENT') {
        return jsonResponse(
          { error: 'Validation Error', message: 'Parent email already belongs to a non-parent user' },
          409,
          corsHeaders
        );
      }

      if (existingUser) {
        resolvedParentId = existingUser.id;
      } else {
        const generatedParentId = parentId && parentId !== 'p_new' ? parentId : `p_${id}`;
        const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
        const parentUserName = parentName?.trim() || `${name} Parent`;

        await db
          .prepare('INSERT INTO users (id, name, email, password, password_hash, role, must_change_password, last_password_change) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)')
          .bind(generatedParentId, parentUserName, trimmedParentEmail, DEFAULT_PASSWORD, passwordHash, 'PARENT', 1)
          .run();

        resolvedParentId = generatedParentId;
      }
    }

    await db
      .prepare('INSERT INTO students (id, name, parent_id, class_ids, attendance, at_risk, school, parent_name, relationship, emergency_contact, parent_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(
        id,
        name,
        resolvedParentId,
        JSON.stringify(classIds || []),
        attendance || 0,
        atRisk ? 1 : 0,
        school || null,
        parentName || null,
        relationship || null,
        emergencyContact || null,
        trimmedParentEmail || null
      )
      .run();

    const created = await db
      .prepare('SELECT * FROM students WHERE id = ?')
      .bind(id)
      .first();

    return jsonResponse(toCamelCase(created), 201, corsHeaders);
  } catch (error) {
    console.error('Create student error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleUpdateStudent({ params, body, db, corsHeaders }) {
  const studentId = params.id;
  try {
    const {
      name,
      parentId,
      classIds,
      attendance,
      atRisk,
      school,
      parentName,
      relationship,
      emergencyContact,
      parentEmail,
    } = body;

    await db
      .prepare('UPDATE students SET name = ?, parent_id = ?, class_ids = ?, attendance = ?, at_risk = ?, school = ?, parent_name = ?, relationship = ?, emergency_contact = ?, parent_email = ? WHERE id = ?')
      .bind(
        name || null,
        parentId || null,
        JSON.stringify(classIds || []),
        attendance !== undefined ? attendance : null,
        atRisk !== undefined ? (atRisk ? 1 : 0) : null,
        school || null,
        parentName || null,
        relationship || null,
        emergencyContact || null,
        parentEmail || null,
        studentId
      )
      .run();

    const updated = await db
      .prepare('SELECT * FROM students WHERE id = ?')
      .bind(studentId)
      .first();

    if (!updated) {
      return jsonResponse(
        { error: 'Not Found', message: 'Student not found' },
        404,
        corsHeaders
      );
    }

    return jsonResponse(toCamelCase(updated), 200, corsHeaders);
  } catch (error) {
    console.error('Update student error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleDeleteStudent({ params, db, corsHeaders }) {
  const studentId = params.id;
  try {
    await db
      .prepare('DELETE FROM students WHERE id = ?')
      .bind(studentId)
      .run();

    return new Response(null, { status: 204, headers: corsHeaders });
  } catch (error) {
    console.error('Delete student error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}
