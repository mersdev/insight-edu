/**
 * User Repository
 * Handles all database operations for users
 */

import { BaseRepository } from './BaseRepository.js';

export class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.executeQuery(query, [email]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Find user by email with password (for authentication)
   */
  async findByEmailWithPassword(email) {
    const query = 'SELECT id, name, email, password, password_hash, role, must_change_password FROM users WHERE email = $1';
    const result = await this.executeQuery(query, [email]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Update user password
   */
  async updatePassword(userId, passwordHash) {
    const query = `
      UPDATE users 
      SET password_hash = $1, 
          must_change_password = false, 
          last_password_change = NOW() 
      WHERE id = $2 
      RETURNING id, name, email, role, must_change_password
    `;
    const result = await this.executeQuery(query, [passwordHash, userId]);
    return result.rows[0];
  }

  /**
   * Find users by role
   */
  async findByRole(role) {
    const query = 'SELECT id, name, email, role, must_change_password FROM users WHERE role = $1 ORDER BY name';
    const result = await this.executeQuery(query, [role]);
    return result.rows;
  }

  /**
   * Get all users without sensitive data
   */
  async findAllSafe() {
    const query = 'SELECT id, name, email, role, must_change_password FROM users ORDER BY id';
    const result = await this.executeQuery(query);
    return result.rows;
  }
}

export default new UserRepository();

