import { jsonResponse } from '../utils/response.js';
import { toCamelCase, toCamelCaseArray } from '../utils/casing.js';

export async function handleGetScores({ db, corsHeaders }) {
  try {
    const scores = await db
      .prepare('SELECT * FROM scores ORDER BY date DESC')
      .all();

    return jsonResponse(toCamelCaseArray(scores.results || []), 200, corsHeaders);
  } catch (error) {
    console.error('Get scores error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleCreateScore({ body, db, corsHeaders }) {
  try {
    const { studentId, date, subject, value, type } = body;

    if (!studentId || !date || !subject || value === undefined || !type) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Missing required fields' },
        400,
        corsHeaders
      );
    }

    const existing = await db
      .prepare('SELECT * FROM scores WHERE student_id = ? AND date = ? AND subject = ? AND type = ?')
      .bind(studentId, date, subject, type)
      .all();

    if (existing.results && existing.results.length > 0) {
      const scoreId = existing.results[0].id;
      await db
        .prepare('UPDATE scores SET value = ? WHERE id = ?')
        .bind(value, scoreId)
        .run();

      const updated = await db
        .prepare('SELECT * FROM scores WHERE id = ?')
        .bind(scoreId)
        .first();

      return jsonResponse(toCamelCase(updated), 200, corsHeaders);
    }

    await db
      .prepare('INSERT INTO scores (student_id, date, subject, value, type) VALUES (?, ?, ?, ?, ?)')
      .bind(studentId, date, subject, value, type)
      .run();

    const created = await db
      .prepare('SELECT * FROM scores WHERE student_id = ? AND date = ? AND subject = ? AND type = ? ORDER BY id DESC LIMIT 1')
      .bind(studentId, date, subject, type)
      .first();

    return jsonResponse(toCamelCase(created), 201, corsHeaders);
  } catch (error) {
    console.error('Create score error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}
