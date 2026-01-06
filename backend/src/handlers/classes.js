import { jsonResponse } from '../utils/response.js';
import { toCamelCase } from '../utils/casing.js';
import { normalizeDefaultSchedule } from '../utils/schedule.js';

function mapClassRecord(record) {
  const camelRecord = toCamelCase(record);
  camelRecord.defaultSchedule = normalizeDefaultSchedule(camelRecord.defaultSchedule);
  return camelRecord;
}

export async function handleGetClasses({ db, corsHeaders }) {
  try {
    const classes = await db
      .prepare('SELECT * FROM classes ORDER BY id')
      .all();

    const parsedClasses = (classes.results || []).map(mapClassRecord);
    return jsonResponse(parsedClasses, 200, corsHeaders);
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
    const normalizedDefaultSchedule = normalizeDefaultSchedule(defaultSchedule);

    if (!id || !name || !teacherId || !grade) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Missing required fields' },
        400,
        corsHeaders
      );
    }

    await db
      .prepare('INSERT INTO classes (id, name, teacher_id, location_id, grade, default_schedule) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, name, teacherId, locationId || null, grade, JSON.stringify(normalizedDefaultSchedule))
      .run();

    const created = await db
      .prepare('SELECT * FROM classes WHERE id = ?')
      .bind(id)
      .first();

    return jsonResponse(mapClassRecord(created), 201, corsHeaders);
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

    return jsonResponse(mapClassRecord(classItem), 200, corsHeaders);
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

    const existing = await db
      .prepare('SELECT * FROM classes WHERE id = ?')
      .bind(classId)
      .first();

    if (!existing) {
      return jsonResponse(
        { error: 'Not Found', message: 'Class not found' },
        404,
        corsHeaders
      );
    }

    const normalizedDefaultSchedule =
      defaultSchedule === undefined
        ? normalizeDefaultSchedule(existing.default_schedule)
        : normalizeDefaultSchedule(defaultSchedule);

    await db
      .prepare('UPDATE classes SET name = ?, teacher_id = ?, location_id = ?, grade = ?, default_schedule = ? WHERE id = ?')
      .bind(
        name ?? existing.name,
        teacherId ?? existing.teacher_id,
        locationId ?? existing.location_id,
        grade ?? existing.grade,
        JSON.stringify(normalizedDefaultSchedule),
        classId
      )
      .run();

    const updated = await db
      .prepare('SELECT * FROM classes WHERE id = ?')
      .bind(classId)
      .first();

    return jsonResponse(mapClassRecord(updated), 200, corsHeaders);
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
