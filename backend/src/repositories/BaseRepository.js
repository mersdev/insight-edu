/**
 * Base Repository Pattern
 * Provides common database operations with error handling
 * Following Repository Pattern and Dependency Inversion Principle
 */

import pool from '../config/database.js';
import { DatabaseError, NotFoundError } from '../utils/errors.js';

/**
 * Base Repository class with common CRUD operations
 */
export class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.pool = pool;
  }

  /**
   * Execute a query with error handling
   */
  async executeQuery(query, params = []) {
    try {
      const result = await this.pool.query(query, params);
      return result;
    } catch (error) {
      console.error(`Database error in ${this.tableName}:`, error);
      throw new DatabaseError(`Failed to execute query on ${this.tableName}`, error);
    }
  }

  /**
   * Find all records
   */
  async findAll(orderBy = 'id') {
    const query = `SELECT * FROM ${this.tableName} ORDER BY ${orderBy}`;
    const result = await this.executeQuery(query);
    return result.rows;
  }

  /**
   * Find record by ID
   */
  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.executeQuery(query, [id]);
    
    if (result.rows.length === 0) {
      throw new NotFoundError(`${this.tableName} with id ${id}`);
    }
    
    return result.rows[0];
  }

  /**
   * Find records by condition
   */
  async findBy(conditions) {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);
    const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
    
    const query = `SELECT * FROM ${this.tableName} WHERE ${whereClause}`;
    const result = await this.executeQuery(query, values);
    return result.rows;
  }

  /**
   * Find one record by condition
   */
  async findOneBy(conditions) {
    const records = await this.findBy(conditions);
    return records.length > 0 ? records[0] : null;
  }

  /**
   * Create a new record
   */
  async create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    const columns = keys.join(', ');
    
    const query = `
      INSERT INTO ${this.tableName} (${columns}) 
      VALUES (${placeholders}) 
      RETURNING *
    `;
    
    const result = await this.executeQuery(query, values);
    return result.rows[0];
  }

  /**
   * Update a record by ID
   */
  async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
    
    const query = `
      UPDATE ${this.tableName} 
      SET ${setClause} 
      WHERE id = $${keys.length + 1} 
      RETURNING *
    `;
    
    const result = await this.executeQuery(query, [...values, id]);
    
    if (result.rows.length === 0) {
      throw new NotFoundError(`${this.tableName} with id ${id}`);
    }
    
    return result.rows[0];
  }

  /**
   * Delete a record by ID
   */
  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
    const result = await this.executeQuery(query, [id]);
    
    if (result.rows.length === 0) {
      throw new NotFoundError(`${this.tableName} with id ${id}`);
    }
    
    return result.rows[0];
  }

  /**
   * Count records
   */
  async count(conditions = {}) {
    let query = `SELECT COUNT(*) FROM ${this.tableName}`;
    const values = [];
    
    if (Object.keys(conditions).length > 0) {
      const keys = Object.keys(conditions);
      const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
      query += ` WHERE ${whereClause}`;
      values.push(...Object.values(conditions));
    }
    
    const result = await this.executeQuery(query, values);
    return parseInt(result.rows[0].count);
  }

  /**
   * Check if record exists
   */
  async exists(id) {
    const query = `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE id = $1)`;
    const result = await this.executeQuery(query, [id]);
    return result.rows[0].exists;
  }

  /**
   * Begin transaction
   */
  async beginTransaction() {
    const client = await this.pool.connect();
    await client.query('BEGIN');
    return client;
  }

  /**
   * Commit transaction
   */
  async commitTransaction(client) {
    await client.query('COMMIT');
    client.release();
  }

  /**
   * Rollback transaction
   */
  async rollbackTransaction(client) {
    await client.query('ROLLBACK');
    client.release();
  }
}

