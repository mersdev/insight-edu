import jwt from 'jsonwebtoken';
import { getCorsHeaders, jsonResponse } from './utils/response.js';
import { toCamelCase } from './utils/casing.js';
import { PUBLIC_ROUTES, AUTH_ROUTES, getRouteKey, resolveParamRoute } from './routes.js';

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
    const jwtSecret = env.JWT_SECRET || 'test-secret-key';

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
