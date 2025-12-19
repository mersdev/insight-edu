/**
 * LocationRepository
 * Data access layer for location operations
 */

import { BaseRepository } from './BaseRepository.js';

class LocationRepository extends BaseRepository {
  constructor() {
    super('locations');
  }

  /**
   * Get all locations
   */
  async findAll() {
    const query = 'SELECT * FROM locations ORDER BY id';
    const result = await this.executeQuery(query);
    return result.rows;
  }

  /**
   * Get location by ID
   */
  async findById(id) {
    const query = 'SELECT * FROM locations WHERE id = $1';
    const result = await this.executeQuery(query, [id]);
    return result.rows[0];
  }

  /**
   * Get location by name
   */
  async findByName(name) {
    const query = 'SELECT * FROM locations WHERE name = $1';
    const result = await this.executeQuery(query, [name]);
    return result.rows[0];
  }

  /**
   * Create location
   */
  async createLocation(locationData) {
    const { id, name, address } = locationData;
    
    const query = `
      INSERT INTO locations (id, name, address)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await this.executeQuery(query, [id, name, address]);
    return result.rows[0];
  }

  /**
   * Update location
   */
  async updateLocation(id, locationData) {
    const { name, address } = locationData;
    
    const query = `
      UPDATE locations
      SET name = COALESCE($2, name),
          address = COALESCE($3, address)
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await this.executeQuery(query, [id, name, address]);
    return result.rows[0];
  }

  /**
   * Delete location
   */
  async deleteLocation(id) {
    const query = 'DELETE FROM locations WHERE id = $1 RETURNING *';
    const result = await this.executeQuery(query, [id]);
    return result.rows[0];
  }

  /**
   * Check if location exists by name
   */
  async existsByName(name) {
    const query = 'SELECT EXISTS(SELECT 1 FROM locations WHERE name = $1)';
    const result = await this.executeQuery(query, [name]);
    return result.rows[0].exists;
  }

  /**
   * Check if location exists by ID
   */
  async existsById(id) {
    const query = 'SELECT EXISTS(SELECT 1 FROM locations WHERE id = $1)';
    const result = await this.executeQuery(query, [id]);
    return result.rows[0].exists;
  }
}

export default new LocationRepository();

