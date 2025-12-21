import bcrypt from 'bcryptjs';
import { jsonResponse } from '../utils/response.js';
import { toCamelCase, toCamelCaseArray } from '../utils/casing.js';

const DEFAULT_PASSWORD = '123';
const SALT_ROUNDS = 10;

export async function handleGetTeachers({ db, corsHeaders }) {
  try {
    const teachers = await db
      .prepare('SELECT * FROM teachers ORDER BY id')
      .all();

    return jsonResponse(toCamelCaseArray(teachers.results || []), 200, corsHeaders);
  } catch (error) {
    console.error('Get teachers error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleCreateTeacher({ body, db, corsHeaders }) {
  try {
    const { id, name, englishName, chineseName, email, subject, phone, description } = body;

    if (!id || !name || !email || !subject) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Missing required fields' },
        400,
        corsHeaders
      );
    }

    await db
      .prepare('INSERT INTO teachers (id, name, english_name, chinese_name, email, subject, phone, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, name, englishName || null, chineseName || null, email, subject, phone || null, description || null)
      .run();

    const existingUser = await db
      .prepare('SELECT id, role FROM users WHERE email = ?')
      .bind(email)
      .first();

    if (existingUser && existingUser.role !== 'TEACHER') {
      return jsonResponse(
        { error: 'Validation Error', message: 'Email already belongs to a non-teacher user' },
        409,
        corsHeaders
      );
    }

    if (!existingUser) {
      const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

      await db
        .prepare('INSERT INTO users (id, name, email, password, password_hash, role, must_change_password, last_password_change) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)')
        .bind(id, name, email, DEFAULT_PASSWORD, passwordHash, 'TEACHER', 1)
        .run();
    }

    const created = await db
      .prepare('SELECT * FROM teachers WHERE id = ?')
      .bind(id)
      .first();

    return jsonResponse(toCamelCase(created), 201, corsHeaders);
  } catch (error) {
    console.error('Create teacher error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleGetTeacher({ params, db, corsHeaders }) {
  const teacherId = params.id;
  try {
    const teacher = await db
      .prepare('SELECT * FROM teachers WHERE id = ?')
      .bind(teacherId)
      .first();

    if (!teacher) {
      return jsonResponse(
        { error: 'Not Found', message: 'Teacher not found' },
        404,
        corsHeaders
      );
    }

    return jsonResponse(toCamelCase(teacher), 200, corsHeaders);
  } catch (error) {
    console.error('Get teacher error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleUpdateTeacher({ params, body, db, corsHeaders }) {
  const teacherId = params.id;
  try {
    const { name, englishName, chineseName, email, subject, phone, description } = body;

    await db
      .prepare('UPDATE teachers SET name = ?, english_name = ?, chinese_name = ?, email = ?, subject = ?, phone = ?, description = ? WHERE id = ?')
      .bind(name, englishName, chineseName, email, subject, phone, description, teacherId)
      .run();

    const updated = await db
      .prepare('SELECT * FROM teachers WHERE id = ?')
      .bind(teacherId)
      .first();

    if (!updated) {
      return jsonResponse(
        { error: 'Not Found', message: 'Teacher not found' },
        404,
        corsHeaders
      );
    }

    return jsonResponse(toCamelCase(updated), 200, corsHeaders);
  } catch (error) {
    console.error('Update teacher error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleDeleteTeacher({ params, db, corsHeaders }) {
  const teacherId = params.id;
  try {
    await db
      .prepare('DELETE FROM teachers WHERE id = ?')
      .bind(teacherId)
      .run();

    return new Response(null, { status: 204, headers: corsHeaders });
  } catch (error) {
    console.error('Delete teacher error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}
