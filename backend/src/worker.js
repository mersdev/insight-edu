/**
 * Cloudflare Worker - Insight EDU Backend
 * Main entry point for the Cloudflare Workers application
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Convert snake_case object keys to camelCase
 * Also parses JSON string fields (class_ids) to arrays
 */
function toCamelCase(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (typeof obj !== 'object') return obj;

  const camelObj = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

    // Parse JSON string fields to arrays
    if (key === 'class_ids' && typeof value === 'string') {
      try {
        camelObj[camelKey] = JSON.parse(value);
      } catch (e) {
        camelObj[camelKey] = [];
      }
    } else {
      camelObj[camelKey] = typeof value === 'object' && value !== null ? toCamelCase(value) : value;
    }
  }
  return camelObj;
}

/**
 * Convert snake_case array to camelCase
 */
function toCamelCaseArray(arr) {
  if (!Array.isArray(arr)) return arr;
  return arr.map(toCamelCase);
}

/**
 * Main fetch handler for Cloudflare Worker
 */
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;
      const method = request.method;

      // CORS headers
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };

      // Handle CORS preflight
      if (method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }

      // Initialize database
      const db = env.DB;

      // Parse request body if needed
      let body = {};
      if (method !== 'GET' && method !== 'HEAD') {
        try {
          body = await request.json();
        } catch (e) {
          // Body is not JSON, continue
        }
      }

      // Extract auth token
      const authHeader = request.headers.get('authorization');
      let user = null;

      // Public routes (no auth required)
      if (pathname === '/api/auth/login' && method === 'POST') {
        return handleLogin(body, db, corsHeaders);
      }

      // Health check (public)
      if (pathname === '/health' && method === 'GET') {
        return jsonResponse({ status: 'ok', message: 'Server is running' }, 200, corsHeaders);
      }

      // All other routes require authentication
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return jsonResponse(
          { error: 'Authentication Error', message: 'No token provided' },
          401,
          corsHeaders
        );
      }

      // Verify token and get user
      const token = authHeader.substring(7);
      const jwtSecret = env.JWT_SECRET || 'test-secret-key';

      try {
        user = jwt.verify(token, jwtSecret);
        // Verify user still exists in database
        const userResult = await db
          .prepare('SELECT id, name, email, role, must_change_password FROM users WHERE id = ?')
          .bind(user.id)
          .first();

        if (!userResult) {
          return jsonResponse(
            { error: 'Authentication Error', message: 'User not found' },
            401,
            corsHeaders
          );
        }
        user = userResult;
      } catch (error) {
        return jsonResponse(
          { error: 'Authentication Error', message: 'Invalid or expired token' },
          401,
          corsHeaders
        );
      }

      // Route handling - Auth routes
      if (pathname === '/api/auth/me' && method === 'GET') {
        return jsonResponse({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.must_change_password || false,
        }, 200, corsHeaders);
      }

      if (pathname === '/api/auth/change-password' && method === 'POST') {
        return handleChangePassword(body, user, db, env, corsHeaders);
      }

      // Settings routes
      if (pathname === '/api/settings' && method === 'GET') {
        return handleGetSettings(db, corsHeaders);
      }

      if (pathname === '/api/settings' && method === 'PUT') {
        return handleUpdateSettings(body, db, corsHeaders);
      }

      // Users routes
      if (pathname === '/api/users' && method === 'GET') {
        return handleGetUsers(db, corsHeaders);
      }

      if (pathname === '/api/users' && method === 'POST') {
        return handleCreateUser(body, db, corsHeaders);
      }

      // Users by ID routes
      const userIdMatch = pathname.match(/^\/api\/users\/([^/]+)$/);
      if (userIdMatch) {
        const userId = userIdMatch[1];
        if (method === 'PUT') {
          return handleUpdateUser(userId, body, db, corsHeaders);
        }
        if (method === 'DELETE') {
          return handleDeleteUser(userId, db, corsHeaders);
        }
      }

      // Locations routes
      if (pathname === '/api/locations' && method === 'GET') {
        return handleGetLocations(db, corsHeaders);
      }

      if (pathname === '/api/locations' && method === 'POST') {
        return handleCreateLocation(body, db, corsHeaders);
      }

      // Locations by ID routes
      const locationIdMatch = pathname.match(/^\/api\/locations\/([^/]+)$/);
      if (locationIdMatch) {
        const locationId = locationIdMatch[1];
        if (method === 'GET') {
          return handleGetLocation(locationId, db, corsHeaders);
        }
        if (method === 'PUT') {
          return handleUpdateLocation(locationId, body, db, corsHeaders);
        }
        if (method === 'DELETE') {
          return handleDeleteLocation(locationId, db, corsHeaders);
        }
      }

      // Teachers routes
      if (pathname === '/api/teachers' && method === 'GET') {
        return handleGetTeachers(db, corsHeaders);
      }

      if (pathname === '/api/teachers' && method === 'POST') {
        return handleCreateTeacher(body, db, corsHeaders);
      }

      // Teachers by ID routes
      const teacherIdMatch = pathname.match(/^\/api\/teachers\/([^/]+)$/);
      if (teacherIdMatch) {
        const teacherId = teacherIdMatch[1];
        if (method === 'GET') {
          return handleGetTeacher(teacherId, db, corsHeaders);
        }
        if (method === 'PUT') {
          return handleUpdateTeacher(teacherId, body, db, corsHeaders);
        }
        if (method === 'DELETE') {
          return handleDeleteTeacher(teacherId, db, corsHeaders);
        }
      }

      // Classes routes
      if (pathname === '/api/classes' && method === 'GET') {
        return handleGetClasses(db, corsHeaders);
      }

      if (pathname === '/api/classes' && method === 'POST') {
        return handleCreateClass(body, db, corsHeaders);
      }

      // Classes by ID routes
      const classIdMatch = pathname.match(/^\/api\/classes\/([^/]+)$/);
      if (classIdMatch) {
        const classId = classIdMatch[1];
        if (method === 'GET') {
          return handleGetClass(classId, db, corsHeaders);
        }
        if (method === 'PUT') {
          return handleUpdateClass(classId, body, db, corsHeaders);
        }
        if (method === 'DELETE') {
          return handleDeleteClass(classId, db, corsHeaders);
        }
      }

      // Students routes
      if (pathname === '/api/students' && method === 'GET') {
        return handleGetStudents(db, corsHeaders);
      }

      if (pathname === '/api/students' && method === 'POST') {
        return handleCreateStudent(body, db, corsHeaders);
      }

      // Students by ID routes
      const studentIdMatch = pathname.match(/^\/api\/students\/([^/]+)$/);
      if (studentIdMatch) {
        const studentId = studentIdMatch[1];
        if (method === 'PUT') {
          return handleUpdateStudent(studentId, body, db, corsHeaders);
        }
        if (method === 'DELETE') {
          return handleDeleteStudent(studentId, db, corsHeaders);
        }
      }

      // Sessions routes
      if (pathname === '/api/sessions' && method === 'GET') {
        return handleGetSessions(db, corsHeaders);
      }

      if (pathname === '/api/sessions' && method === 'POST') {
        return handleCreateSession(body, db, corsHeaders);
      }

      // Sessions by ID routes
      const sessionIdMatch = pathname.match(/^\/api\/sessions\/([^/]+)(?:\/(.+))?$/);
      if (sessionIdMatch) {
        const sessionId = sessionIdMatch[1];
        const subPath = sessionIdMatch[2];

        if (method === 'GET' && !subPath) {
          return handleGetSession(sessionId, db, corsHeaders);
        }
        if (method === 'PUT' && !subPath) {
          return handleUpdateSession(sessionId, body, db, corsHeaders);
        }
        if (method === 'PUT' && subPath === 'status') {
          return handleUpdateSessionStatus(sessionId, body, db, corsHeaders);
        }
        if (method === 'DELETE') {
          return handleDeleteSession(sessionId, db, corsHeaders);
        }
      }

      // Attendance routes
      if (pathname === '/api/attendance' && method === 'GET') {
        return handleGetAttendance(db, corsHeaders);
      }

      if (pathname === '/api/attendance' && method === 'POST') {
        return handleCreateAttendance(body, db, corsHeaders);
      }

      // Scores routes
      if (pathname === '/api/scores' && method === 'GET') {
        return handleGetScores(db, corsHeaders);
      }

      if (pathname === '/api/scores' && method === 'POST') {
        return handleCreateScore(body, db, corsHeaders);
      }

      // Behaviors routes
      if (pathname === '/api/behaviors' && method === 'GET') {
        return handleGetBehaviors(db, corsHeaders);
      }

      if (pathname === '/api/behaviors' && method === 'POST') {
        return handleCreateBehavior(body, db, corsHeaders);
      }

      // Student Insights routes
      if (pathname === '/api/student-insights' && method === 'GET') {
        return handleGetStudentInsights(db, corsHeaders);
      }

      // Student Insights by ID routes
      const insightIdMatch = pathname.match(/^\/api\/student-insights\/([^/]+)$/);
      if (insightIdMatch) {
        const studentId = insightIdMatch[1];
        if (method === 'GET') {
          return handleGetStudentInsight(studentId, db, corsHeaders);
        }
      }

      if (pathname === '/api/student-insights' && method === 'POST') {
        return handleSaveStudentInsight(body, db, corsHeaders);
      }

      // Sync routes
      if (pathname === '/api/sync' && method === 'POST') {
        return handleSync(body, db, corsHeaders);
      }

      return jsonResponse(
        { error: 'Not Found', message: 'Route not found' },
        404,
        corsHeaders
      );
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse(
        { error: 'Internal Server Error', message: error.message },
        500
      );
    }
  },
};

// Helper function to return JSON responses
function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

// ============================================================================
// AUTH HANDLERS
// ============================================================================

async function handleLogin(body, db, corsHeaders) {
  const { email, password } = body;

  if (!email || !password) {
    return jsonResponse(
      { error: 'Validation Error', message: 'Email and password are required' },
      400,
      corsHeaders
    );
  }

  try {
    const user = await db
      .prepare('SELECT id, name, email, password, password_hash, role, must_change_password FROM users WHERE email = ?')
      .bind(email)
      .first();

    if (!user) {
      return jsonResponse(
        { error: 'Authentication Error', message: 'Invalid email or password' },
        401,
        corsHeaders
      );
    }

    // Verify password
    let isValidPassword = false;
    if (user.password_hash) {
      isValidPassword = await bcrypt.compare(password, user.password_hash);
    } else if (user.password) {
      isValidPassword = password === user.password;
    }

    if (!isValidPassword) {
      return jsonResponse(
        { error: 'Authentication Error', message: 'Invalid email or password' },
        401,
        corsHeaders
      );
    }

    // Generate JWT token
    const jwtSecret = 'test-secret-key';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '24h' }
    );

    return jsonResponse({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.must_change_password || false,
      },
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Login error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

async function handleChangePassword(body, user, db, env, corsHeaders) {
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return jsonResponse(
      { error: 'Validation Error', message: 'Current and new passwords are required' },
      400,
      corsHeaders
    );
  }

  try {
    const userWithPassword = await db
      .prepare('SELECT password, password_hash FROM users WHERE id = ?')
      .bind(user.id)
      .first();

    // Verify current password
    let isValidPassword = false;
    if (userWithPassword.password_hash) {
      isValidPassword = await bcrypt.compare(currentPassword, userWithPassword.password_hash);
    } else if (userWithPassword.password) {
      isValidPassword = currentPassword === userWithPassword.password;
    }

    if (!isValidPassword) {
      return jsonResponse(
        { error: 'Authentication Error', message: 'Current password is incorrect' },
        401,
        corsHeaders
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await db
      .prepare('UPDATE users SET password_hash = ?, must_change_password = 0, last_password_change = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(passwordHash, user.id)
      .run();

    return jsonResponse(
      { message: 'Password changed successfully' },
      200,
      corsHeaders
    );
  } catch (error) {
    console.error('Change password error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

// ============================================================================
// SETTINGS HANDLERS
// ============================================================================

async function handleGetSettings(db, corsHeaders) {
  try {
    const settings = await db
      .prepare('SELECT * FROM settings LIMIT 1')
      .first();

    return jsonResponse(settings || {}, 200, corsHeaders);
  } catch (error) {
    console.error('Get settings error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

async function handleUpdateSettings(body, db, corsHeaders) {
  try {
    const { dashboardInsight, lastAnalyzed, insightAutoUpdateHours } = body;

    await db
      .prepare('UPDATE settings SET dashboard_insight = ?, last_analyzed = ?, insight_auto_update_hours = ?')
      .bind(dashboardInsight || '', lastAnalyzed || '', insightAutoUpdateHours || 12)
      .run();

    const updated = await db
      .prepare('SELECT * FROM settings LIMIT 1')
      .first();

    return jsonResponse(toCamelCase(updated), 200, corsHeaders);
  } catch (error) {
    console.error('Update settings error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

// ============================================================================
// USERS HANDLERS
// ============================================================================

async function handleGetUsers(db, corsHeaders) {
  try {
    const users = await db
      .prepare('SELECT id, name, email, role, must_change_password FROM users ORDER BY id')
      .all();

    return jsonResponse(toCamelCaseArray(users.results || []), 200, corsHeaders);
  } catch (error) {
    console.error('Get users error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

async function handleCreateUser(body, db, corsHeaders) {
  try {
    const { id, name, email, password, role } = body;

    if (!id || !name || !email || !password || !role) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Missing required fields' },
        400,
        corsHeaders
      );
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await db
      .prepare('INSERT INTO users (id, name, email, password_hash, role, must_change_password) VALUES (?, ?, ?, ?, ?, 0)')
      .bind(id, name, email, passwordHash, role)
      .run();

    const created = await db
      .prepare('SELECT id, name, email, role, must_change_password FROM users WHERE id = ?')
      .bind(id)
      .first();

    return jsonResponse(toCamelCase(created), 201, corsHeaders);
  } catch (error) {
    console.error('Create user error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

async function handleUpdateUser(userId, body, db, corsHeaders) {
  try {
    const { name, email, role } = body;

    await db
      .prepare('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?')
      .bind(name, email, role, userId)
      .run();

    const updated = await db
      .prepare('SELECT id, name, email, role, must_change_password FROM users WHERE id = ?')
      .bind(userId)
      .first();

    if (!updated) {
      return jsonResponse(
        { error: 'Not Found', message: 'User not found' },
        404,
        corsHeaders
      );
    }

    return jsonResponse(toCamelCase(updated), 200, corsHeaders);
  } catch (error) {
    console.error('Update user error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

async function handleDeleteUser(userId, db, corsHeaders) {
  try {
    await db
      .prepare('DELETE FROM users WHERE id = ?')
      .bind(userId)
      .run();

    return new Response(null, { status: 204, headers: corsHeaders });
  } catch (error) {
    console.error('Delete user error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

// ============================================================================
// LOCATIONS HANDLERS
// ============================================================================

async function handleGetLocations(db, corsHeaders) {
  try {
    const locations = await db
      .prepare('SELECT * FROM locations ORDER BY id')
      .all();

    return jsonResponse(locations.results || [], 200, corsHeaders);
  } catch (error) {
    console.error('Get locations error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

async function handleCreateLocation(body, db, corsHeaders) {
  try {
    const { id, name, address } = body;

    if (!id || !name) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Missing required fields' },
        400,
        corsHeaders
      );
    }

    await db
      .prepare('INSERT INTO locations (id, name, address) VALUES (?, ?, ?)')
      .bind(id, name, address || null)
      .run();

    const created = await db
      .prepare('SELECT * FROM locations WHERE id = ?')
      .bind(id)
      .first();

    return jsonResponse(toCamelCase(created), 201, corsHeaders);
  } catch (error) {
    console.error('Create location error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

async function handleGetLocation(locationId, db, corsHeaders) {
  try {
    const location = await db
      .prepare('SELECT * FROM locations WHERE id = ?')
      .bind(locationId)
      .first();

    if (!location) {
      return jsonResponse(
        { error: 'Not Found', message: 'Location not found' },
        404,
        corsHeaders
      );
    }

    return jsonResponse(location, 200, corsHeaders);
  } catch (error) {
    console.error('Get location error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

async function handleUpdateLocation(locationId, body, db, corsHeaders) {
  try {
    const { name, address } = body;

    await db
      .prepare('UPDATE locations SET name = ?, address = ? WHERE id = ?')
      .bind(name, address, locationId)
      .run();

    const updated = await db
      .prepare('SELECT * FROM locations WHERE id = ?')
      .bind(locationId)
      .first();

    if (!updated) {
      return jsonResponse(
        { error: 'Not Found', message: 'Location not found' },
        404,
        corsHeaders
      );
    }

    return jsonResponse(toCamelCase(updated), 200, corsHeaders);
  } catch (error) {
    console.error('Update location error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

async function handleDeleteLocation(locationId, db, corsHeaders) {
  try {
    await db
      .prepare('DELETE FROM locations WHERE id = ?')
      .bind(locationId)
      .run();

    return new Response(null, { status: 204, headers: corsHeaders });
  } catch (error) {
    console.error('Delete location error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

// ============================================================================
// TEACHERS HANDLERS
// ============================================================================

async function handleGetTeachers(db, corsHeaders) {
  try {
    const teachers = await db
      .prepare('SELECT * FROM teachers ORDER BY id')
      .all();

    return jsonResponse(toCamelCaseArray(teachers.results || []), 200, corsHeaders);
  } catch (error) {
    console.error('Get teachers error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

async function handleCreateTeacher(body, db, corsHeaders) {
  try {
    const { id, name, englishName, chineseName, email, subject, phone, description } = body;

    if (!id || !name || !email || !subject) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Missing required fields' },
        400,
        corsHeaders
      );
    }

    await db
      .prepare('INSERT INTO teachers (id, name, english_name, chinese_name, email, subject, phone, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, name, englishName || null, chineseName || null, email, subject, phone || null, description || null)
      .run();

    const created = await db
      .prepare('SELECT * FROM teachers WHERE id = ?')
      .bind(id)
      .first();

    return jsonResponse(toCamelCase(created), 201, corsHeaders);
  } catch (error) {
    console.error('Create teacher error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

async function handleGetTeacher(teacherId, db, corsHeaders) {
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

    return jsonResponse(toCamelCase(teacher), 200, corsHeaders);
  } catch (error) {
    console.error('Get teacher error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

async function handleUpdateTeacher(teacherId, body, db, corsHeaders) {
  try {
    const { name, englishName, chineseName, email, subject, phone, description } = body;

    await db
      .prepare('UPDATE teachers SET name = ?, english_name = ?, chinese_name = ?, email = ?, subject = ?, phone = ?, description = ? WHERE id = ?')
      .bind(name, englishName, chineseName, email, subject, phone, description, teacherId)
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

    return jsonResponse(toCamelCase(updated), 200, corsHeaders);
  } catch (error) {
    console.error('Update teacher error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

async function handleDeleteTeacher(teacherId, db, corsHeaders) {
  try {
    await db
      .prepare('DELETE FROM teachers WHERE id = ?')
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

// ============================================================================
// CLASSES HANDLERS
// ============================================================================

async function handleGetClasses(db, corsHeaders) {
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

async function handleCreateClass(body, db, corsHeaders) {
  try {
    const { id, name, teacherId, locationId, grade, defaultSchedule } = body;

    if (!id || !name || !grade) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Missing required fields' },
        400,
        corsHeaders
      );
    }

    await db
      .prepare('INSERT INTO classes (id, name, teacher_id, location_id, grade, default_schedule) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, name, teacherId || null, locationId || null, grade, defaultSchedule ? JSON.stringify(defaultSchedule) : null)
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

async function handleGetClass(classId, db, corsHeaders) {
  try {
    const classData = await db
      .prepare('SELECT * FROM classes WHERE id = ?')
      .bind(classId)
      .first();

    if (!classData) {
      return jsonResponse(
        { error: 'Not Found', message: 'Class not found' },
        404,
        corsHeaders
      );
    }

    return jsonResponse(classData, 200, corsHeaders);
  } catch (error) {
    console.error('Get class error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

async function handleUpdateClass(classId, body, db, corsHeaders) {
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

async function handleDeleteClass(classId, db, corsHeaders) {
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

// ============================================================================
// STUDENTS HANDLERS
// ============================================================================

async function handleGetStudents(db, corsHeaders) {
  try {
    const students = await db
      .prepare('SELECT * FROM students ORDER BY id')
      .all();

    return jsonResponse(toCamelCaseArray(students.results || []), 200, corsHeaders);
  } catch (error) {
    console.error('Get students error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

async function handleCreateStudent(body, db, corsHeaders) {
  try {
    // Accept both camelCase and snake_case field names
    const id = body.id;
    const name = body.name;
    const parentId = body.parentId || body.parent_id;
    const classIds = body.classIds || body.class_ids;
    const attendance = body.attendance;
    const atRisk = body.atRisk !== undefined ? body.atRisk : body.at_risk;
    const school = body.school;
    const parentName = body.parentName || body.parent_name;
    const relationship = body.relationship;
    const emergencyContact = body.emergencyContact || body.emergency_contact;
    const parentEmail = body.parentEmail || body.parent_email;

    if (!id || !name) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Missing required fields' },
        400,
        corsHeaders
      );
    }

    await db
      .prepare('INSERT INTO students (id, name, parent_id, class_ids, attendance, at_risk, school, parent_name, relationship, emergency_contact, parent_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(
        id,
        name,
        parentId || null,
        JSON.stringify(classIds || []),
        attendance || 0,
        atRisk ? 1 : 0,
        school || null,
        parentName || null,
        relationship || null,
        emergencyContact || null,
        parentEmail || null
      )
      .run();

    const created = await db
      .prepare('SELECT * FROM students WHERE id = ?')
      .bind(id)
      .first();

    return jsonResponse(toCamelCase(created), 201, corsHeaders);
  } catch (error) {
    console.error('Create student error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

async function handleUpdateStudent(studentId, body, db, corsHeaders) {
  try {
    // Accept both camelCase and snake_case field names
    const name = body.name;
    const parentId = body.parentId || body.parent_id;
    const classIds = body.classIds || body.class_ids;
    const attendance = body.attendance;
    const atRisk = body.atRisk !== undefined ? body.atRisk : body.at_risk;
    const school = body.school;
    const parentName = body.parentName || body.parent_name;
    const relationship = body.relationship;
    const emergencyContact = body.emergencyContact || body.emergency_contact;
    const parentEmail = body.parentEmail || body.parent_email;

    await db
      .prepare('UPDATE students SET name = ?, parent_id = ?, class_ids = ?, attendance = ?, at_risk = ?, school = ?, parent_name = ?, relationship = ?, emergency_contact = ?, parent_email = ? WHERE id = ?')
      .bind(
        name || null,
        parentId || null,
        classIds ? JSON.stringify(classIds) : '[]',
        attendance !== undefined ? attendance : null,
        atRisk !== undefined ? (atRisk ? 1 : 0) : null,
        school || null,
        parentName || null,
        relationship || null,
        emergencyContact || null,
        parentEmail || null,
        studentId
      )
      .run();

    const updated = await db
      .prepare('SELECT * FROM students WHERE id = ?')
      .bind(studentId)
      .first();

    if (!updated) {
      return jsonResponse(
        { error: 'Not Found', message: 'Student not found' },
        404,
        corsHeaders
      );
    }

    return jsonResponse(toCamelCase(updated), 200, corsHeaders);
  } catch (error) {
    console.error('Update student error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

async function handleDeleteStudent(studentId, db, corsHeaders) {
  try {
    await db
      .prepare('DELETE FROM students WHERE id = ?')
      .bind(studentId)
      .run();

    return new Response(null, { status: 204, headers: corsHeaders });
  } catch (error) {
    console.error('Delete student error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

// ============================================================================
// SESSIONS HANDLERS
// ============================================================================

async function handleGetSessions(db, corsHeaders) {
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

async function handleCreateSession(body, db, corsHeaders) {
  try {
    const { id, classId, date, startTime, type, status, targetStudentIds } = body;

    if (!id || !classId || !date || !startTime || !type || !status) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Missing required fields' },
        400,
        corsHeaders
      );
    }

    await db
      .prepare('INSERT INTO sessions (id, class_id, date, start_time, type, status, target_student_ids) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id, classId, date, startTime, type, status, targetStudentIds ? JSON.stringify(targetStudentIds) : null)
      .run();

    const created = await db
      .prepare('SELECT * FROM sessions WHERE id = ?')
      .bind(id)
      .first();

    return jsonResponse(toCamelCase(created), 201, corsHeaders);
  } catch (error) {
    console.error('Create session error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

async function handleGetSession(sessionId, db, corsHeaders) {
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

async function handleUpdateSession(sessionId, body, db, corsHeaders) {
  try {
    const { classId, date, startTime, type, status, targetStudentIds } = body;

    await db
      .prepare('UPDATE sessions SET class_id = ?, date = ?, start_time = ?, type = ?, status = ?, target_student_ids = ? WHERE id = ?')
      .bind(classId, date, startTime, type, status, targetStudentIds ? JSON.stringify(targetStudentIds) : null, sessionId)
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

async function handleUpdateSessionStatus(sessionId, body, db, corsHeaders) {
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

async function handleDeleteSession(sessionId, db, corsHeaders) {
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

// ============================================================================
// ATTENDANCE HANDLERS
// ============================================================================

async function handleGetAttendance(db, corsHeaders) {
  try {
    const attendance = await db
      .prepare('SELECT * FROM attendance ORDER BY id')
      .all();

    return jsonResponse(toCamelCaseArray(attendance.results || []), 200, corsHeaders);
  } catch (error) {
    console.error('Get attendance error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

async function handleCreateAttendance(body, db, corsHeaders) {
  try {
    const { id, studentId, sessionId, status, reason } = body;

    if (!id || !studentId || !sessionId || !status) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Missing required fields' },
        400,
        corsHeaders
      );
    }

    await db
      .prepare('INSERT INTO attendance (id, student_id, session_id, status, reason) VALUES (?, ?, ?, ?, ?)')
      .bind(id, studentId, sessionId, status, reason || null)
      .run();

    const created = await db
      .prepare('SELECT * FROM attendance WHERE id = ?')
      .bind(id)
      .first();

    return jsonResponse(toCamelCase(created), 201, corsHeaders);
  } catch (error) {
    console.error('Create attendance error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

// ============================================================================
// SCORES HANDLERS
// ============================================================================

async function handleGetScores(db, corsHeaders) {
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

async function handleCreateScore(body, db, corsHeaders) {
  try {
    const { studentId, date, subject, value, type } = body;

    if (!studentId || !date || !subject || value === undefined || !type) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Missing required fields' },
        400,
        corsHeaders
      );
    }

    await db
      .prepare('INSERT INTO scores (student_id, date, subject, value, type) VALUES (?, ?, ?, ?, ?)')
      .bind(studentId, date, subject, value, type)
      .run();

    const created = await db
      .prepare('SELECT * FROM scores WHERE student_id = ? AND date = ? AND subject = ? ORDER BY id DESC LIMIT 1')
      .bind(studentId, date, subject)
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

// ============================================================================
// BEHAVIORS HANDLERS
// ============================================================================

async function handleGetBehaviors(db, corsHeaders) {
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

async function handleCreateBehavior(body, db, corsHeaders) {
  try {
    const { studentId, sessionId, date, category, rating } = body;

    if (!studentId || !sessionId || !date || !category || !rating) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Missing required fields' },
        400,
        corsHeaders
      );
    }

    // Validate rating range (1-5)
    if (rating < 1 || rating > 5) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Rating must be between 1 and 5' },
        400,
        corsHeaders
      );
    }

    await db
      .prepare('INSERT INTO behaviors (student_id, session_id, date, category, rating) VALUES (?, ?, ?, ?, ?)')
      .bind(studentId, sessionId, date, category, rating)
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

// ============================================================================
// STUDENT INSIGHTS HANDLERS
// ============================================================================

async function handleGetStudentInsights(db, corsHeaders) {
  try {
    const insights = await db
      .prepare('SELECT * FROM student_insights ORDER BY student_id')
      .all();

    return jsonResponse(insights.results || [], 200, corsHeaders);
  } catch (error) {
    console.error('Get student insights error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

async function handleGetStudentInsight(studentId, db, corsHeaders) {
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

    return jsonResponse(insight, 200, corsHeaders);
  } catch (error) {
    console.error('Get student insight error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

async function handleSaveStudentInsight(body, db, corsHeaders) {
  try {
    const { studentId, insights, lastAnalyzed } = body;

    if (!studentId || !insights) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Missing required fields' },
        400,
        corsHeaders
      );
    }

    // Check if insight exists
    const existing = await db
      .prepare('SELECT id FROM student_insights WHERE student_id = ?')
      .bind(studentId)
      .first();

    if (existing) {
      // Update existing
      await db
        .prepare('UPDATE student_insights SET insights = ?, last_analyzed = ? WHERE student_id = ?')
        .bind(JSON.stringify(insights), lastAnalyzed || new Date().toISOString(), studentId)
        .run();
    } else {
      // Insert new
      await db
        .prepare('INSERT INTO student_insights (student_id, insights, last_analyzed) VALUES (?, ?, ?)')
        .bind(studentId, JSON.stringify(insights), lastAnalyzed || new Date().toISOString())
        .run();
    }

    const saved = await db
      .prepare('SELECT * FROM student_insights WHERE student_id = ?')
      .bind(studentId)
      .first();

    return jsonResponse(saved, 201, corsHeaders);
  } catch (error) {
    console.error('Save student insight error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

// ============================================================================
// SYNC HANDLERS
// ============================================================================

async function handleSync(body, db, corsHeaders) {
  try {
    // Placeholder for sync functionality
    return jsonResponse(
      { message: 'Sync completed successfully' },
      200,
      corsHeaders
    );
  } catch (error) {
    console.error('Sync error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

