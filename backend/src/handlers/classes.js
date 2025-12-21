import { jsonResponse } from '../utils/response.js';
import { toCamelCase, toCamelCaseArray } from '../utils/casing.js';

export async function handleGetClasses({ db, corsHeaders }) {
  try {
    const classes = await db
      .prepare('SELECT * FROM classes ORDER BY id')
      .all();

    return jsonResponse(toCamelCaseArray(classes.results || []), 200, corsHeaders);
  } catch (error) {
    console.error('Get classes error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleCreateClass({ body, db, corsHeaders }) {
  try {
    const { id, name, teacherId, locationId, grade, defaultSchedule } = body;

    if (!id || !name || !teacherId || !grade) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Missing required fields' },
        400,
        corsHeaders
      );
    }

    await db
      .prepare('INSERT INTO classes (id, name, teacher_id, location_id, grade, default_schedule) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, name, teacherId, locationId || null, grade, defaultSchedule ? JSON.stringify(defaultSchedule) : null)
      .run();

    const created = await db
      .prepare('SELECT * FROM classes WHERE id = ?')
      .bind(id)
      .first();

    return jsonResponse(toCamelCase(created), 201, corsHeaders);
  } catch (error) {
    console.error('Create class error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleGetClass({ params, db, corsHeaders }) {
  const classId = params.id;
  try {
    const classItem = await db
      .prepare('SELECT * FROM classes WHERE id = ?')
      .bind(classId)
      .first();

    if (!classItem) {
      return jsonResponse(
        { error: 'Not Found', message: 'Class not found' },
        404,
        corsHeaders
      );
    }

    return jsonResponse(toCamelCase(classItem), 200, corsHeaders);
  } catch (error) {
    console.error('Get class error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleUpdateClass({ params, body, db, corsHeaders }) {
  const classId = params.id;
  try {
    const { name, teacherId, locationId, grade, defaultSchedule } = body;

    await db
      .prepare('UPDATE classes SET name = ?, teacher_id = ?, location_id = ?, grade = ?, default_schedule = ? WHERE id = ?')
      .bind(name, teacherId, locationId, grade, defaultSchedule ? JSON.stringify(defaultSchedule) : null, classId)
      .run();

    const updated = await db
      .prepare('SELECT * FROM classes WHERE id = ?')
      .bind(classId)
      .first();

    if (!updated) {
      return jsonResponse(
        { error: 'Not Found', message: 'Class not found' },
        404,
        corsHeaders
      );
    }

    return jsonResponse(toCamelCase(updated), 200, corsHeaders);
  } catch (error) {
    console.error('Update class error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleDeleteClass({ params, db, corsHeaders }) {
  const classId = params.id;
  try {
    await db
      .prepare('DELETE FROM classes WHERE id = ?')
      .bind(classId)
      .run();

    return new Response(null, { status: 204, headers: corsHeaders });
  } catch (error) {
    console.error('Delete class error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}
