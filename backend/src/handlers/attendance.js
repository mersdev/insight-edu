import { jsonResponse } from '../utils/response.js';
import { toCamelCase, toCamelCaseArray } from '../utils/casing.js';

export async function handleGetAttendance({ db, corsHeaders }) {
  try {
    const attendance = await db
      .prepare('SELECT * FROM attendance ORDER BY id')
      .all();

    return jsonResponse(toCamelCaseArray(attendance.results || []), 200, corsHeaders);
  } catch (error) {
    console.error('Get attendance error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleCreateAttendance({ body, db, corsHeaders }) {
  try {
    const { id, studentId, sessionId, status, reason } = body;

    if (!id || !studentId || !sessionId || !status) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Missing required fields' },
        400,
        corsHeaders
      );
    }

    await db
      .prepare('INSERT INTO attendance (id, student_id, session_id, status, reason) VALUES (?, ?, ?, ?, ?)')
      .bind(id, studentId, sessionId, status, reason || null)
      .run();

    const created = await db
      .prepare('SELECT * FROM attendance WHERE id = ?')
      .bind(id)
      .first();

    return jsonResponse(toCamelCase(created), 201, corsHeaders);
  } catch (error) {
    console.error('Create attendance error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}
