import { jsonResponse } from '../utils/response.js';
import { toCamelCase, toCamelCaseArray } from '../utils/casing.js';

export async function handleGetBehaviors({ db, corsHeaders }) {
  try {
    const behaviors = await db
      .prepare('SELECT * FROM behaviors ORDER BY date DESC')
      .all();

    return jsonResponse(toCamelCaseArray(behaviors.results || []), 200, corsHeaders);
  } catch (error) {
    console.error('Get behaviors error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleCreateBehavior({ body, db, corsHeaders }) {
  try {
    const { studentId, sessionId, date, category, rating } = body;

    if (!studentId || !sessionId || !date || !category || rating === undefined) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Missing required fields' },
        400,
        corsHeaders
      );
    }

    await db
      .prepare('INSERT INTO behaviors (student_id, session_id, date, category, rating) VALUES (?, ?, ?, ?, ?)')
      .bind(studentId, sessionId, date, category, rating)
      .run();

    const created = await db
      .prepare('SELECT * FROM behaviors WHERE student_id = ? AND session_id = ? AND category = ? ORDER BY id DESC LIMIT 1')
      .bind(studentId, sessionId, category)
      .first();

    return jsonResponse(toCamelCase(created), 201, corsHeaders);
  } catch (error) {
    console.error('Create behavior error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}
