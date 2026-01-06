const VALID_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const EMPTY_SCHEDULE = { days: [], time: null, durationMinutes: 60 };

export function normalizeDefaultSchedule(schedule) {
  let scheduleValue = schedule;

  if (typeof schedule === 'string') {
    try {
      scheduleValue = JSON.parse(schedule);
    } catch {
      scheduleValue = null;
    }
  }

  if (!scheduleValue || typeof scheduleValue !== 'object') {
    return { ...EMPTY_SCHEDULE };
  }

  const rawDays = Array.isArray(scheduleValue.days)
    ? scheduleValue.days
    : typeof scheduleValue.dayOfWeek === 'string'
      ? [scheduleValue.dayOfWeek]
      : [];

  const cleanedDays = Array.from(new Set(rawDays))
    .map((day) => (typeof day === 'string' ? day.trim() : ''))
    .filter((day) => VALID_DAYS.includes(day));

  const time = typeof scheduleValue.time === 'string' && scheduleValue.time.trim()
    ? scheduleValue.time.trim()
    : null;

  const durationMinutes =
    typeof scheduleValue.durationMinutes === 'number' && !Number.isNaN(scheduleValue.durationMinutes)
      ? Math.max(0, scheduleValue.durationMinutes)
      : 60;

  return {
    days: cleanedDays,
    time,
    durationMinutes,
  };
}

export function getMonthRange(targetDate = new Date()) {
  const year = targetDate.getUTCFullYear();
  const monthIndex = targetDate.getUTCMonth();
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0));
  return { start, end };
}

export function formatDateUTC(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatMonthUTC(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getWeekdayNameUTC(date) {
  const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return WEEKDAYS[date.getUTCDay()];
}
