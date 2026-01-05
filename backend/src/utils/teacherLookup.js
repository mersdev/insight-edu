const parseClassIds = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string' && item);
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => typeof item === 'string' && item);
      }
    } catch {
      return value.split(',').map((entry) => entry.trim()).filter(Boolean);
    }
  }
  return [];
};

const findTeacherFromClassIds = async (db, classIds) => {
  for (const classId of classIds) {
    const cls = await db
      .prepare('SELECT teacher_id FROM classes WHERE id = ?')
      .bind(classId)
      .first();
    if (cls?.teacher_id) {
      return cls.teacher_id;
    }
  }
  return null;
};

const findTeacherBySession = async (db, sessionId) => {
  if (!sessionId) return null;
  const session = await db
    .prepare('SELECT class_id FROM sessions WHERE id = ?')
    .bind(sessionId)
    .first();
  if (!session?.class_id) return null;
  const cls = await db
    .prepare('SELECT teacher_id FROM classes WHERE id = ?')
    .bind(session.class_id)
    .first();
  return cls?.teacher_id ?? null;
};

export async function resolveTeacherId({ db, providedId, user, sessionId, studentId }) {
  if (!db) return null;

  if (providedId) {
    const existing = await db
      .prepare('SELECT id FROM teachers WHERE id = ?')
      .bind(providedId)
      .first();
    if (existing?.id) {
      return existing.id;
    }
  }

  if (user?.id) {
    const byUserId = await db
      .prepare('SELECT id FROM teachers WHERE id = ?')
      .bind(user.id)
      .first();
    if (byUserId?.id) {
      return byUserId.id;
    }
  }

  if (user?.email) {
    const byEmail = await db
      .prepare('SELECT id FROM teachers WHERE email = ?')
      .bind(user.email)
      .first();
    if (byEmail?.id) {
      return byEmail.id;
    }
  }

  const sessionTeacherId = await findTeacherBySession(db, sessionId);
  if (sessionTeacherId) {
    return sessionTeacherId;
  }

  if (studentId) {
    const student = await db
      .prepare('SELECT class_ids FROM students WHERE id = ?')
      .bind(studentId)
      .first();
    const classIds = parseClassIds(student?.class_ids);
    const classTeacherId = await findTeacherFromClassIds(db, classIds);
    if (classTeacherId) {
      return classTeacherId;
    }
  }

  return null;
}
