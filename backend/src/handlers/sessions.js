import { jsonResponse } from '../utils/response.js';
import { toCamelCase, toCamelCaseArray } from '../utils/casing.js';
import { parseMonthInput, runMonthlySessionScheduler } from './scheduler.js';

function buildUpcomingMonths(baseDate) {
  const start = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), 1));
  return [0, 1, 2].map((offset) => {
    return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + offset, 1));
  });
}

export async function ensureUpcomingSessions(db, baseDate = new Date()) {
  const months = buildUpcomingMonths(baseDate);
  for (const monthDate of months) {
    await runMonthlySessionScheduler({ db, targetDate: monthDate });
  }
}

export async function handleGetSessions({ db, corsHeaders, request }) {
  try {
    const sessions = await db
      .prepare('SELECT * FROM sessions ORDER BY date DESC, start_time')
      .all();

    return jsonResponse(toCamelCaseArray(sessions.results || []), 200, corsHeaders);
  } catch (error) {
    console.error('Get sessions error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleCreateSession({ body, db, corsHeaders }) {
  const { id, classId, date, startTime, durationMinutes, type, status, targetStudentIds } = body;

  if (!id || !classId || !date || !startTime || !type || !status) {
    return jsonResponse(
      { error: 'Validation Error', message: 'Missing required fields' },
      400,
      corsHeaders
    );
  }

  try {
    const existing = await db
      .prepare('SELECT * FROM sessions WHERE class_id = ? AND date = ? AND start_time = ?')
      .bind(classId, date, startTime)
      .first();

    if (existing) {
      return jsonResponse(toCamelCase(existing), 200, corsHeaders);
    }

    await db
      .prepare('INSERT INTO sessions (id, class_id, date, start_time, duration_minutes, type, status, target_student_ids) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(
        id,
        classId,
        date,
        startTime,
        typeof durationMinutes === 'number' && !Number.isNaN(durationMinutes) ? durationMinutes : 60,
        type,
        status,
        targetStudentIds ? JSON.stringify(targetStudentIds) : null
      )
      .run();

    const created = await db
      .prepare('SELECT * FROM sessions WHERE id = ?')
      .bind(id)
      .first();

    return jsonResponse(toCamelCase(created), 201, corsHeaders);
  } catch (error) {
    console.error('Create session error:', error);

    if (
      typeof error?.message === 'string' &&
      error.message.includes('UNIQUE constraint failed: sessions.class_id, sessions.date, sessions.start_time')
    ) {
      try {
        const conflict = await db
          .prepare('SELECT * FROM sessions WHERE class_id = ? AND date = ? AND start_time = ?')
          .bind(classId, date, startTime)
          .first();

        if (conflict) {
          return jsonResponse(
            {
              error: 'Conflict',
              message: 'A session already exists for this class at the specified date and time.',
              session: toCamelCase(conflict),
            },
            409,
            corsHeaders
          );
        }
      } catch (lookupError) {
        console.warn('Failed to fetch conflicting session after constraint error:', lookupError);
      }

      return jsonResponse(
        {
          error: 'Conflict',
          message: 'A session already exists for this class at the specified date and time.',
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

export async function handleGetSession({ params, db, corsHeaders }) {
  const sessionId = params.id;
  try {
    const session = await db
      .prepare('SELECT * FROM sessions WHERE id = ?')
      .bind(sessionId)
      .first();

    if (!session) {
      return jsonResponse(
        { error: 'Not Found', message: 'Session not found' },
        404,
        corsHeaders
      );
    }

    return jsonResponse(toCamelCase(session), 200, corsHeaders);
  } catch (error) {
    console.error('Get session error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleUpdateSession({ params, body, db, corsHeaders }) {
  const sessionId = params.id;
  try {
    const { classId, date, startTime, durationMinutes, type, status, targetStudentIds } = body;

    await db
      .prepare('UPDATE sessions SET class_id = ?, date = ?, start_time = ?, duration_minutes = ?, type = ?, status = ?, target_student_ids = ? WHERE id = ?')
      .bind(
        classId,
        date,
        startTime,
        typeof durationMinutes === 'number' && !Number.isNaN(durationMinutes) ? durationMinutes : 60,
        type,
        status,
        targetStudentIds ? JSON.stringify(targetStudentIds) : null,
        sessionId
      )
      .run();

    const updated = await db
      .prepare('SELECT * FROM sessions WHERE id = ?')
      .bind(sessionId)
      .first();

    if (!updated) {
      return jsonResponse(
        { error: 'Not Found', message: 'Session not found' },
        404,
        corsHeaders
      );
    }

    return jsonResponse(toCamelCase(updated), 200, corsHeaders);
  } catch (error) {
    console.error('Update session error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleUpdateSessionStatus({ params, body, db, corsHeaders }) {
  const sessionId = params.id;
  try {
    const { status } = body;

    if (!status) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Status is required' },
        400,
        corsHeaders
      );
    }

    await db
      .prepare('UPDATE sessions SET status = ? WHERE id = ?')
      .bind(status, sessionId)
      .run();

    const updated = await db
      .prepare('SELECT * FROM sessions WHERE id = ?')
      .bind(sessionId)
      .first();

    if (!updated) {
      return jsonResponse(
        { error: 'Not Found', message: 'Session not found' },
        404,
        corsHeaders
      );
    }

    return jsonResponse(toCamelCase(updated), 200, corsHeaders);
  } catch (error) {
    console.error('Update session status error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleDeleteSession({ params, db, corsHeaders }) {
  const sessionId = params.id;
  try {
    await db
      .prepare('DELETE FROM sessions WHERE id = ?')
      .bind(sessionId)
      .run();

    return new Response(null, { status: 204, headers: corsHeaders });
  } catch (error) {
    console.error('Delete session error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}
