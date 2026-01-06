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
  const { id, studentId, sessionId, status, reason } = body;

  if (!id || !studentId || !sessionId || !status) {
    return jsonResponse(
      { error: 'Validation Error', message: 'Missing required fields' },
      400,
      corsHeaders
    );
  }

  try {
    const existing = await db
      .prepare('SELECT * FROM attendance WHERE student_id = ? AND session_id = ?')
      .bind(studentId, sessionId)
      .first();

    if (existing) {
      await db
        .prepare('UPDATE attendance SET status = ?, reason = ? WHERE student_id = ? AND session_id = ?')
        .bind(status, reason || null, studentId, sessionId)
        .run();

      const updated = await db
        .prepare('SELECT * FROM attendance WHERE student_id = ? AND session_id = ?')
        .bind(studentId, sessionId)
        .first();

      return jsonResponse(toCamelCase(updated), 200, corsHeaders);
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

    if (
      typeof error?.message === 'string' &&
      error.message.includes('UNIQUE constraint failed: attendance.student_id, attendance.session_id')
    ) {
      try {
        const conflict = await db
          .prepare('SELECT * FROM attendance WHERE student_id = ? AND session_id = ?')
          .bind(studentId, sessionId)
          .first();

        if (conflict) {
          return jsonResponse(
            {
              error: 'Conflict',
              message: 'Attendance already recorded for this student and session.',
              attendance: toCamelCase(conflict),
            },
            409,
            corsHeaders
          );
        }
      } catch (lookupError) {
        console.warn('Failed to fetch conflicting attendance after constraint error:', lookupError);
      }

      return jsonResponse(
        {
          error: 'Conflict',
          message: 'Attendance already recorded for this student and session.',
        },
        409,
        corsHeaders
      );
    }

    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}
