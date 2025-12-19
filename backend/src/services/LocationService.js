/**
 * LocationService
 * Business logic for location operations
 */

import LocationRepository from '../repositories/LocationRepository.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';

class LocationService {
  /**
   * Get all locations
   */
  async getAllLocations() {
    return await LocationRepository.findAll();
  }

  /**
   * Get location by ID
   */
  async getLocationById(id) {
    const location = await LocationRepository.findById(id);
    if (!location) {
      throw new NotFoundError('Location not found');
    }
    return location;
  }

  /**
   * Get location by name
   */
  async getLocationByName(name) {
    const location = await LocationRepository.findByName(name);
    if (!location) {
      throw new NotFoundError('Location not found');
    }
    return location;
  }

  /**
   * Create a new location
   */
  async createLocation(locationData) {
    // Validate location data
    this.validateLocationData(locationData);

    // Check if location with same name already exists
    const existingLocation = await LocationRepository.findByName(locationData.name);
    if (existingLocation) {
      throw new ConflictError('Location with this name already exists');
    }

    return await LocationRepository.createLocation(locationData);
  }

  /**
   * Update a location
   */
  async updateLocation(id, locationData) {
    // Check if location exists
    const existingLocation = await LocationRepository.findById(id);
    if (!existingLocation) {
      throw new NotFoundError('Location not found');
    }

    // If name is being updated, check for conflicts
    if (locationData.name && locationData.name !== existingLocation.name) {
      const nameConflict = await LocationRepository.findByName(locationData.name);
      if (nameConflict) {
        throw new ConflictError('Location with this name already exists');
      }
    }

    return await LocationRepository.updateLocation(id, locationData);
  }

  /**
   * Delete a location
   */
  async deleteLocation(id) {
    const location = await LocationRepository.findById(id);
    if (!location) {
      throw new NotFoundError('Location not found');
    }

    return await LocationRepository.deleteLocation(id);
  }

  /**
   * Validate location data
   */
  validateLocationData(data) {
    const errors = [];

    if (!data.name || data.name.trim() === '') {
      errors.push({ field: 'name', message: 'Location name is required' });
    }

    if (data.name && data.name.length > 100) {
      errors.push({ field: 'name', message: 'Location name must be less than 100 characters' });
    }

    if (data.address && data.address.length > 255) {
      errors.push({ field: 'address', message: 'Address must be less than 255 characters' });
    }

    if (errors.length > 0) {
      throw new ValidationError('Location validation failed', errors);
    }
  }
}

export default new LocationService();

