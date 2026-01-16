import bcrypt from 'bcryptjs';
import { jsonResponse } from '../utils/response.js';
import { toCamelCase, toCamelCaseArray } from '../utils/casing.js';
import { formatNotificationEmail } from '../utils/loginEmail.js';

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
      address,
    } = body;

    if (!id || !name) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Missing required fields' },
        400,
        corsHeaders
      );
    }

    const baseParentName = parentName?.trim() || `${name} Parent`;
    const parentDisplayName = baseParentName.toLowerCase().includes('parent')
      ? baseParentName
      : `${baseParentName} Parent`;
    const providedParentEmail = parentEmail?.trim();
    let loginParentEmail = providedParentEmail || null;
    let resolvedParentId = null;

    const userById = parentId
      ? await db.prepare('SELECT id, role, email FROM users WHERE id = ?').bind(parentId).first()
      : null;

    if (userById) {
      if (userById.role !== 'PARENT') {
        return jsonResponse(
          { error: 'Validation Error', message: 'Provided parent account is not a parent user' },
          409,
          corsHeaders
        );
      }
      resolvedParentId = userById.id;
      loginParentEmail = loginParentEmail || userById.email || null;
    }

    if (loginParentEmail) {
      const existingUserByEmail = await db
        .prepare('SELECT id, role, email FROM users WHERE email = ?')
        .bind(loginParentEmail)
        .first();

      if (existingUserByEmail) {
        if (existingUserByEmail.role !== 'PARENT') {
          return jsonResponse(
            { error: 'Validation Error', message: 'Parent email already belongs to a non-parent user' },
            409,
            corsHeaders
          );
        }
        resolvedParentId = existingUserByEmail.id;
        loginParentEmail = existingUserByEmail.email || loginParentEmail;
      } else {
        const generatedParentId = parentId && parentId !== 'p_new' ? parentId : `p_${id}`;
        const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

        await db
          .prepare('INSERT INTO users (id, name, email, password, password_hash, role, must_change_password, last_password_change) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)')
          .bind(generatedParentId, parentDisplayName, loginParentEmail, DEFAULT_PASSWORD, passwordHash, 'PARENT', 1)
          .run();

        resolvedParentId = generatedParentId;
      }
    }

    await db
      .prepare('INSERT INTO students (id, name, parent_id, class_ids, attendance, at_risk, school, parent_name, relationship, emergency_contact, parent_email, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
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
        loginParentEmail || null,
        address || null
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
      address,
    } = body;

    const existing = await db
      .prepare('SELECT * FROM students WHERE id = ?')
      .bind(studentId)
      .first();

    if (!existing) {
      return jsonResponse(
        { error: 'Not Found', message: 'Student not found' },
        404,
        corsHeaders
      );
    }

    const existingCamel = toCamelCase(existing);
    const finalParentEmail = parentEmail !== undefined ? (parentEmail?.trim() || null) : existing.parent_email;
    const finalParentId = parentId !== undefined ? parentId : existing.parent_id;
    const finalClassIds = classIds !== undefined ? classIds : existingCamel.classIds || [];
    const finalAttendance = attendance !== undefined ? attendance : existing.attendance;
    const finalAtRisk = atRisk !== undefined ? (atRisk ? 1 : 0) : existing.at_risk;
    const finalSchool = school !== undefined ? school : existing.school;
    const finalParentName = parentName !== undefined ? parentName : existing.parent_name;
    const finalRelationship = relationship !== undefined ? relationship : existing.relationship;
    const finalEmergencyContact = emergencyContact !== undefined ? emergencyContact : existing.emergency_contact;
    const finalAddress = address !== undefined ? address : existing.address;

    await db
      .prepare('UPDATE students SET name = ?, parent_id = ?, class_ids = ?, attendance = ?, at_risk = ?, school = ?, parent_name = ?, relationship = ?, emergency_contact = ?, parent_email = ?, address = ? WHERE id = ?')
      .bind(
        name ?? existing.name,
        finalParentId || null,
        JSON.stringify(finalClassIds || []),
        finalAttendance,
        finalAtRisk,
        finalSchool || null,
        finalParentName || null,
        finalRelationship || null,
        finalEmergencyContact || null,
        finalParentEmail || null,
        finalAddress || null,
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
    const student = await db
      .prepare('SELECT id, parent_id FROM students WHERE id = ?')
      .bind(studentId)
      .first();

    if (!student) {
      return jsonResponse(
        { error: 'Not Found', message: 'Student not found' },
        404,
        corsHeaders
      );
    }

    const parentId = student.parent_id;

    await db
      .prepare('DELETE FROM students WHERE id = ?')
      .bind(studentId)
      .run();

    if (parentId) {
      const anotherStudent = await db
        .prepare('SELECT id FROM students WHERE parent_id = ? LIMIT 1')
        .bind(parentId)
        .first();

      if (!anotherStudent) {
        await db
          .prepare('DELETE FROM users WHERE id = ?')
          .bind(parentId)
          .run();
      }
    }

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
