import { jsonResponse } from '../utils/response.js';
import { toCamelCase, toCamelCaseArray } from '../utils/casing.js';
import { resolveTeacherId } from '../utils/teacherLookup.js';

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

export async function handleCreateBehavior({ body, db, corsHeaders, user }) {
  try {
    const { studentId, sessionId, date, category, rating } = body;
    const teacherId = await resolveTeacherId({
      db,
      providedId: body.teacherId,
      user,
      sessionId,
      studentId,
    });

    if (!studentId || !sessionId || !date || !category || rating === undefined) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Missing required fields' },
        400,
        corsHeaders
      );
    }

    if (!teacherId && user?.role !== 'HQ') {
      return jsonResponse(
        { error: 'Validation Error', message: 'Teacher not identified' },
        400,
        corsHeaders
      );
    }
    const resolvedTeacherId = teacherId || null;

    await db
      .prepare('INSERT INTO behaviors (student_id, session_id, date, category, teacher_id, rating) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(studentId, sessionId, date, category, resolvedTeacherId, rating)
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

export async function handleUpdateBehavior({ params, body, db, corsHeaders }) {
  try {
    const { id } = params;
    if (!id) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Behavior ID is required' },
        400,
        corsHeaders
      );
    }

    const updates = [];
    const values = [];

    if (body.rating !== undefined) {
      updates.push('rating = ?');
      values.push(body.rating);
    }
    if (body.teacherId !== undefined) {
      const resolvedTeacherId = await resolveTeacherId({ db, providedId: body.teacherId, user });
      if (!resolvedTeacherId) {
        return jsonResponse(
          { error: 'Validation Error', message: 'Teacher not found' },
          400,
          corsHeaders
        );
      }
      updates.push('teacher_id = ?');
      values.push(resolvedTeacherId);
    }
    if (body.category) {
      updates.push('category = ?');
      values.push(body.category);
    }
    if (body.date) {
      updates.push('date = ?');
      values.push(body.date);
    }

    if (updates.length === 0) {
      return jsonResponse(
        { error: 'Validation Error', message: 'No fields provided for update' },
        400,
        corsHeaders
      );
    }

    values.push(id);
    await db
      .prepare(`UPDATE behaviors SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    const updated = await db.prepare('SELECT * FROM behaviors WHERE id = ?').bind(id).first();
    return jsonResponse(toCamelCase(updated), 200, corsHeaders);
  } catch (error) {
    console.error('Update behavior error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleDeleteBehavior({ params, db, corsHeaders }) {
  try {
    const { id } = params;
    if (!id) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Behavior ID is required' },
        400,
        corsHeaders
      );
    }

    await db
      .prepare('DELETE FROM behaviors WHERE id = ?')
      .bind(id)
      .run();

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (error) {
    console.error('Delete behavior error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}
