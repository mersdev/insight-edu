import { jsonResponse } from '../utils/response.js';
import { toCamelCase } from '../utils/casing.js';

export async function handleGetStudentInsight({ params, db, corsHeaders }) {
  const studentId = params.id;
  try {
    const insight = await db
      .prepare('SELECT * FROM student_insights WHERE student_id = ?')
      .bind(studentId)
      .first();

    if (!insight) {
      return jsonResponse(
        { error: 'Not Found', message: 'Insight not found' },
        404,
        corsHeaders
      );
    }

    return jsonResponse(toCamelCase(insight), 200, corsHeaders);
  } catch (error) {
    console.error('Get student insight error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleSaveStudentInsight({ body, db, corsHeaders }) {
  try {
    const { studentId, insights, lastAnalyzed } = body;

    if (!studentId || !insights) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Missing required fields' },
        400,
        corsHeaders
      );
    }

    const existing = await db
      .prepare('SELECT id FROM student_insights WHERE student_id = ?')
      .bind(studentId)
      .first();

    if (existing) {
      await db
        .prepare('UPDATE student_insights SET insights = ?, last_analyzed = ? WHERE student_id = ?')
        .bind(JSON.stringify(insights), lastAnalyzed || new Date().toISOString(), studentId)
        .run();
    } else {
      await db
        .prepare('INSERT INTO student_insights (student_id, insights, last_analyzed) VALUES (?, ?, ?)')
        .bind(studentId, JSON.stringify(insights), lastAnalyzed || new Date().toISOString())
        .run();
    }

    const saved = await db
      .prepare('SELECT * FROM student_insights WHERE student_id = ?')
      .bind(studentId)
      .first();

    return jsonResponse(toCamelCase(saved), 201, corsHeaders);
  } catch (error) {
    console.error('Save student insight error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}
