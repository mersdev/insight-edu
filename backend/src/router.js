import jwt from 'jsonwebtoken';
import { getCorsHeaders, jsonResponse } from './utils/response.js';
import { toCamelCase } from './utils/casing.js';
import { PUBLIC_ROUTES, AUTH_ROUTES, getRouteKey, resolveParamRoute } from './routes.js';

let studentAddressColumnEnsured = false;

const ensureStudentAddressColumn = async (db) => {
  if (studentAddressColumnEnsured) return;
  try {
    await db.prepare('ALTER TABLE students ADD COLUMN address TEXT').run();
  } catch (error) {
    if (
      !error?.message?.includes?.('duplicate column name') &&
      !error?.message?.includes?.('table students has no column named address')
    ) {
      console.warn('Failed to add students.address column:', error.message);
    }
  } finally {
    studentAddressColumnEnsured = true;
  }
};

export async function handleRequest(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;
    const corsHeaders = getCorsHeaders();

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const db = env.DB;
    if (!db) {
      return jsonResponse(
        {
          error: 'Configuration Error',
          message: 'The D1 database binding is not configured. Please set the DB binding before running the worker.',
        },
        500,
        corsHeaders
      );
    }

    await ensureStudentAddressColumn(db);

    let body = {};
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        body = await request.json();
      } catch (e) {
        body = {};
      }
      body = toCamelCase(body);
    }

    const routeKey = getRouteKey(method, pathname);
    const publicHandler = PUBLIC_ROUTES.get(routeKey);
    if (publicHandler) {
      return publicHandler({ request, env, ctx, db, body, corsHeaders });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse(
        { error: 'Authentication Error', message: 'No token provided' },
        401,
        corsHeaders
      );
    }

    const token = authHeader.substring(7);
    const jwtSecret = env.JWT_SECRET || process?.env?.JWT_SECRET || 'test-secret-key';

    let user;
    try {
      const decoded = jwt.verify(token, jwtSecret);
      const userResult = await db
        .prepare('SELECT id, name, email, role, must_change_password FROM users WHERE id = ?')
        .bind(decoded.id)
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

    const context = { request, env, ctx, db, body, user, corsHeaders };
    const handler = AUTH_ROUTES.get(routeKey);
    if (handler) {
      return handler(context);
    }

    const paramResponse = await resolveParamRoute(method, pathname, context);
    if (paramResponse) {
      return paramResponse;
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
}
