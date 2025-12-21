import { jsonResponse } from '../utils/response.js';
import { toCamelCase, toCamelCaseArray } from '../utils/casing.js';

export async function handleGetUsers({ db, corsHeaders }) {
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

export async function handleUpdateUser({ params, body, db, corsHeaders }) {
  const userId = params.id;
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

export async function handleDeleteUser({ params, db, corsHeaders }) {
  const userId = params.id;
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
