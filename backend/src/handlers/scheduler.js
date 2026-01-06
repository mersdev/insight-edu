import { jsonResponse } from '../utils/response.js';
import { normalizeDefaultSchedule, getMonthRange, formatDateUTC, formatMonthUTC, getWeekdayNameUTC } from '../utils/schedule.js';

export function parseMonthInput(input, fallbackDate = new Date()) {
  if (!input) return fallbackDate;
  if (typeof input !== 'string') return null;
  const [yearStr, monthStr] = input.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month || month < 1 || month > 12) return null;
  return new Date(Date.UTC(year, month - 1, 1));
}

async function fetchClasses(db) {
  const classes = await db.prepare('SELECT id, default_schedule FROM classes').all();
  return classes.results || [];
}

async function fetchExistingSessions(db, startDate, endDate) {
  const sessions = await db
    .prepare('SELECT id, class_id, date, start_time FROM sessions WHERE date >= ? AND date <= ?')
    .bind(startDate, endDate)
    .all();
  return sessions.results || [];
}

function buildSessionId(classId, dateStr, startTime) {
  const safeTime = (startTime || '').replace(/:/g, '');
  return `auto_${classId}_${dateStr}_${safeTime}`;
}

export async function runMonthlySessionScheduler({ db, targetDate = new Date() }) {
  if (!db) {
    return { error: 'Configuration Error', message: 'DB binding is missing' };
  }

  const { start, end } = getMonthRange(targetDate);
  const startStr = formatDateUTC(start);
  const endStr = formatDateUTC(end);

  const classes = await fetchClasses(db);
  const existingSessions = await fetchExistingSessions(db, startStr, endStr);
  const existingKeys = new Set(
    existingSessions.map((session) => `${session.class_id}|${session.date}|${session.start_time}`)
  );

  const createdSessions = [];

  for (const cls of classes) {
    const schedule = normalizeDefaultSchedule(cls.default_schedule);
    if (!schedule.time || !schedule.days.length) continue;

    for (let day = new Date(start); day <= end; day.setUTCDate(day.getUTCDate() + 1)) {
      const weekdayName = getWeekdayNameUTC(day);
      if (!schedule.days.includes(weekdayName)) {
        continue;
      }

      const dateStr = formatDateUTC(day);
      const key = `${cls.id}|${dateStr}|${schedule.time}`;
      if (existingKeys.has(key)) {
        continue;
      }

      const sessionId = buildSessionId(cls.id, dateStr, schedule.time);
      await db
        .prepare('INSERT INTO sessions (id, class_id, date, start_time, duration_minutes, type, status, target_student_ids) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(
          sessionId,
          cls.id,
          dateStr,
          schedule.time,
          schedule.durationMinutes ?? 60,
          'REGULAR',
          'SCHEDULED',
          null
        )
        .run();

      existingKeys.add(key);
      createdSessions.push({
        id: sessionId,
        classId: cls.id,
        date: dateStr,
        startTime: schedule.time,
        durationMinutes: schedule.durationMinutes ?? 60,
      });
    }
  }

  return {
    month: formatMonthUTC(start),
    created: createdSessions.length,
    sessions: createdSessions,
  };
}

export async function handleRunScheduler({ db, corsHeaders, body }) {
  const referenceDate = parseMonthInput(body?.month, new Date());
  if (!referenceDate) {
    return jsonResponse(
      { error: 'Validation Error', message: 'Invalid month format. Use YYYY-MM.' },
      400,
      corsHeaders
    );
  }

  const result = await runMonthlySessionScheduler({ db, targetDate: referenceDate });
  if (result?.error) {
    return jsonResponse(result, 500, corsHeaders);
  }

  return jsonResponse(result, 200, corsHeaders);
}

export async function handleDeleteSessionsByMonth({ request, db, corsHeaders, body }) {
  const url = new URL(request.url);
  const monthInput = body?.month || url.searchParams.get('month');
  const referenceDate = parseMonthInput(monthInput, new Date());
  if (!referenceDate) {
    return jsonResponse(
      { error: 'Validation Error', message: 'Invalid month format. Use YYYY-MM.' },
      400,
      corsHeaders
    );
  }

  const { start, end } = getMonthRange(referenceDate);
  const startStr = formatDateUTC(start);
  const endStr = formatDateUTC(end);

  const existing = await db
    .prepare('SELECT id FROM sessions WHERE date >= ? AND date <= ?')
    .bind(startStr, endStr)
    .all();
  const existingIds = (existing.results || []).map((row) => row.id);

  await db
    .prepare('DELETE FROM sessions WHERE date >= ? AND date <= ?')
    .bind(startStr, endStr)
    .run();

  return jsonResponse(
    {
      month: formatMonthUTC(start),
      deleted: existingIds.length,
      deletedIds: existingIds,
    },
    200,
    corsHeaders
  );
}

export async function performScheduledMaintenance({ db, referenceDate = new Date() }) {
  const scheduleResult = await runMonthlySessionScheduler({ db, targetDate: referenceDate });
  // const cleanupResult = await deleteSessionsInRange({
  //   db,
  //   startDate: '2026-01-01',
  //   endDate: '2026-03-31',
  // });
  // return { scheduleResult, cleanupResult };
  return { scheduleResult }
}

export async function deleteSessionsInRange({ db, startDate, endDate }) {
  if (!db || !startDate || !endDate) {
    return { deleted: 0 };
  }

  const existing = await db
    .prepare('SELECT id FROM sessions WHERE date >= ? AND date <= ?')
    .bind(startDate, endDate)
    .all();
  const ids = (existing.results || []).map((row) => row.id);

  if (ids.length) {
    await db
      .prepare('DELETE FROM sessions WHERE date >= ? AND date <= ?')
      .bind(startDate, endDate)
      .run();
  }

  return {
    deleted: ids.length,
    deletedIds: ids,
    startDate,
    endDate,
  };
}
