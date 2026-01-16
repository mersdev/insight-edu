import bcrypt from 'bcryptjs';
import { jsonResponse } from '../utils/response.js';
import { toCamelCase, toCamelCaseArray } from '../utils/casing.js';
import { formatNotificationEmail } from '../utils/loginEmail.js';

const DEFAULT_PASSWORD = '123';
const SALT_ROUNDS = 10;

const dedupeCaseInsensitive = (values = []) => {
  const seen = new Set();
  const result = [];
  values.forEach((value) => {
    const normalized = (value || '').toString().trim();
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(normalized);
    }
  });
  return result;
};

const normalizeStringArray = (value) => {
  if (!value) return [];

  const extract = (input) => {
    if (Array.isArray(input)) {
      return input;
    }
    if (typeof input === 'string' && input.trim()) {
      try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // ignore and fallback to raw string
      }
      return [input];
    }
    return [];
  };

  const raw = extract(value);
  const cleaned = raw
    .map(item => (typeof item === 'string' ? item.trim() : String(item).trim()))
    .filter(item => item);

  return dedupeCaseInsensitive(cleaned);
};

const normalizeSubjectLevels = ({ subjectLevels, subjects, levels }) => {
  const normalizedLevels = normalizeStringArray(levels);
  const normalizedSubjects = normalizeStringArray(subjects);

  const parseSubjectLevels = (raw) => {
    if (!raw) return [];
    const source = typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return []; } })() : raw;
    if (!Array.isArray(source)) return [];

    const pairs = source
      .map((entry) => {
        const subject = typeof entry?.subject === 'string' ? entry.subject.trim() : '';
        const levelList = normalizeStringArray(entry?.levels);
        if (!subject) return null;
        return { subject, levels: levelList };
      })
      .filter(Boolean);

    const unique = [];
    const seen = new Set();
    pairs.forEach((pair) => {
      const key = pair.subject.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      unique.push(pair);
    });

    return unique;
  };

  const parsed = parseSubjectLevels(subjectLevels);
  if (parsed.length > 0) {
    return parsed;
  }

  // Support subjects payload as array of objects: [{ name: 'Math', levels: ['Form 4'] }]
  const parsedSubjectsFromObjects = Array.isArray(subjects)
    ? subjects
        .map((entry) => {
          if (!entry || typeof entry !== 'object') return null;
          const subjectName = (entry.subject || entry.name || '').toString().trim();
          if (!subjectName) return null;
          const entryLevels = normalizeStringArray(entry.levels ?? entry.level ?? normalizedLevels);
          return { subject: subjectName, levels: entryLevels };
        })
        .filter(Boolean)
    : [];
  if (parsedSubjectsFromObjects.length > 0) {
    const unique = [];
    const seen = new Set();
    parsedSubjectsFromObjects.forEach((pair) => {
      const key = pair.subject.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      unique.push(pair);
    });
    return unique;
  }

  if (normalizedSubjects.length > 0) {
    const levelsPerSubject = normalizedLevels.length > 0 ? normalizedLevels : [];
    return normalizedSubjects.map((subject) => ({
      subject,
      levels: levelsPerSubject,
    }));
  }

  return [];
};

const mapTeacherRecord = (record) => {
  const camelRecord = toCamelCase(record);
  const subjectLevels = normalizeSubjectLevels({
    subjectLevels: record.subject_levels,
    subjects: record.subjects ?? record.subject ?? camelRecord.subject,
    levels: record.levels,
  });
  const subjectNames = dedupeCaseInsensitive([
    ...(subjectLevels || []).map((pair) => pair.subject),
    ...normalizeStringArray(record.subjects ?? record.subject ?? camelRecord.subject),
  ]);
  const levels = dedupeCaseInsensitive([
    ...(subjectLevels || []).flatMap((pair) => pair.levels || []),
    ...normalizeStringArray(record.levels),
  ]);

  const subjects = (subjectLevels && subjectLevels.length > 0
    ? subjectLevels
    : subjectNames.map((subject) => ({ subject, levels: [] }))
  ).map((entry) => ({
    name: entry.subject,
    levels: entry.levels || [],
  }));

  return {
    ...camelRecord,
    subjects,
    subjectNames,
    levels,
    subjectLevels,
    subject: camelRecord.subject || subjectNames[0] || subjects[0]?.name || null,
  };
};

export async function handleGetTeachers({ db, corsHeaders }) {
  try {
    const teachers = await db
      .prepare('SELECT * FROM teachers ORDER BY id')
      .all();

    const normalized = (teachers.results || []).map(mapTeacherRecord);
    return jsonResponse(normalized, 200, corsHeaders);
  } catch (error) {
    console.error('Get teachers error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleCreateTeacher({ body, db, corsHeaders }) {
  try {
    const { id, name, englishName, chineseName, email, subject, subjects, levels, subjectLevels, phone, description } = body;

    const normalizedSubjectLevels = normalizeSubjectLevels({
      subjectLevels,
      subjects: subjects ?? subject,
      levels,
    });
    const normalizedSubjects = dedupeCaseInsensitive(normalizedSubjectLevels.map((entry) => entry.subject));
    const normalizedLevels = dedupeCaseInsensitive(normalizedSubjectLevels.flatMap((entry) => entry.levels));

    if (!id || !name || !email) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Missing required fields' },
        400,
        corsHeaders
      );
    }

    if (!normalizedSubjects.length) {
      return jsonResponse(
        { error: 'Validation Error', message: 'At least one subject is required' },
        400,
        corsHeaders
      );
    }

    const hasSubjectLevelGaps = normalizedSubjectLevels.some((pair) => !pair.levels || pair.levels.length === 0);
    if (hasSubjectLevelGaps) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Each subject must include at least one level.' },
        400,
        corsHeaders
      );
    }

    const loginEmail = email?.trim() || formatNotificationEmail(`${name}-${id}`, 'TEACHER');

    const existingUser = await db
      .prepare('SELECT id, role FROM users WHERE email = ?')
      .bind(loginEmail)
      .first();

    if (existingUser && existingUser.role !== 'TEACHER') {
      return jsonResponse(
        { error: 'Validation Error', message: 'Email already belongs to a non-teacher user' },
        409,
        corsHeaders
      );
    }

    await db
      .prepare('INSERT INTO teachers (id, name, english_name, chinese_name, email, subject, subjects, subject_levels, levels, phone, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(
        id,
        name,
        englishName || null,
        chineseName || null,
        loginEmail,
        normalizedSubjects[0],
        JSON.stringify(normalizedSubjects),
        JSON.stringify(normalizedSubjectLevels),
        normalizedLevels.length ? JSON.stringify(normalizedLevels) : null,
        phone || null,
        description || null
      )
      .run();

    if (!existingUser) {
      const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

      await db
        .prepare('INSERT INTO users (id, name, email, password, password_hash, role, must_change_password, last_password_change) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)')
        .bind(id, name, loginEmail, DEFAULT_PASSWORD, passwordHash, 'TEACHER', 1)
        .run();

      // WhatsApp notifications are triggered from the frontend instead of backend emails.
    }

    const created = await db
      .prepare('SELECT * FROM teachers WHERE id = ?')
      .bind(id)
      .first();

    return jsonResponse(mapTeacherRecord(created), 201, corsHeaders);
  } catch (error) {
    console.error('Create teacher error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleGetTeacher({ params, db, corsHeaders }) {
  const teacherId = params.id;
  try {
    const teacher = await db
      .prepare('SELECT * FROM teachers WHERE id = ?')
      .bind(teacherId)
      .first();

    if (!teacher) {
      return jsonResponse(
        { error: 'Not Found', message: 'Teacher not found' },
        404,
        corsHeaders
      );
    }

    return jsonResponse(mapTeacherRecord(teacher), 200, corsHeaders);
  } catch (error) {
    console.error('Get teacher error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleUpdateTeacher({ params, body, db, corsHeaders }) {
  const teacherId = params.id;
  try {
    const { name, englishName, chineseName, email, subjects, levels, subjectLevels, phone, description } = body;

    const existingTeacherRecord = await db
      .prepare('SELECT * FROM teachers WHERE id = ?')
      .bind(teacherId)
      .first();

    if (!existingTeacherRecord) {
      return jsonResponse(
        { error: 'Not Found', message: 'Teacher not found' },
        404,
        corsHeaders
      );
    }

    const existingTeacher = mapTeacherRecord(existingTeacherRecord);

    const normalizedSubjectLevels = normalizeSubjectLevels({
      subjectLevels,
      subjects: subjects ?? existingTeacher.subjects ?? existingTeacher.subject,
      levels: levels ?? existingTeacher.levels,
    });
    const finalSubjects = dedupeCaseInsensitive(normalizedSubjectLevels.map((entry) => entry.subject));
    if (!finalSubjects.length) {
      return jsonResponse(
        { error: 'Validation Error', message: 'At least one subject is required' },
        400,
        corsHeaders
      );
    }

    const finalLevels = dedupeCaseInsensitive(normalizedSubjectLevels.flatMap((entry) => entry.levels || []));
    const hasSubjectLevelGaps = normalizedSubjectLevels.some((pair) => !pair.levels || pair.levels.length === 0);
    if (hasSubjectLevelGaps) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Each subject must include at least one level.' },
        400,
        corsHeaders
      );
    }

    await db
      .prepare('UPDATE teachers SET name = ?, english_name = ?, chinese_name = ?, email = ?, subject = ?, subjects = ?, subject_levels = ?, levels = ?, phone = ?, description = ? WHERE id = ?')
      .bind(
        name ?? existingTeacher.name,
        englishName ?? existingTeacher.englishName,
        chineseName ?? existingTeacher.chineseName,
        email ?? existingTeacher.email,
        finalSubjects[0],
        JSON.stringify(finalSubjects),
        JSON.stringify(normalizedSubjectLevels),
        finalLevels.length ? JSON.stringify(finalLevels) : null,
        phone ?? existingTeacher.phone,
        description ?? existingTeacher.description,
        teacherId
      )
      .run();

    const updated = await db
      .prepare('SELECT * FROM teachers WHERE id = ?')
      .bind(teacherId)
      .first();

    if (!updated) {
      return jsonResponse(
        { error: 'Not Found', message: 'Teacher not found' },
        404,
        corsHeaders
      );
    }

    return jsonResponse(mapTeacherRecord(updated), 200, corsHeaders);
  } catch (error) {
    console.error('Update teacher error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleDeleteTeacher({ params, db, corsHeaders }) {
  const teacherId = params.id;
  try {
    const existing = await db
      .prepare('SELECT id, email, name FROM teachers WHERE id = ?')
      .bind(teacherId)
      .first();

    if (!existing) {
      return jsonResponse(
        { error: 'Not Found', message: 'Teacher not found' },
        404,
        corsHeaders
      );
    }

    await db
      .prepare('DELETE FROM teachers WHERE id = ?')
      .bind(teacherId)
      .run();

    await db
      .prepare('DELETE FROM users WHERE id = ?')
      .bind(teacherId)
      .run();

    return new Response(null, { status: 204, headers: corsHeaders });
  } catch (error) {
    console.error('Delete teacher error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}
