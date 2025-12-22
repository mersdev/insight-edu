import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { jsonResponse } from '../utils/response.js';

const SALT_ROUNDS = 10;

export async function handleLogin({ body, db, env, corsHeaders }) {
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

    const jwtSecret = env.JWT_SECRET || process?.env?.JWT_SECRET || 'test-secret-key';
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
        mustChangePassword: Boolean(user.must_change_password),
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

export async function handleAuthMe({ user, corsHeaders }) {
  return jsonResponse({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    mustChangePassword: Boolean(user.must_change_password),
  }, 200, corsHeaders);
}

export async function handleChangePassword({ body, user, db, corsHeaders }) {
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

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

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
