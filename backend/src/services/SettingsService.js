/**
 * SettingsService
 * Business logic for settings operations
 */

import SettingsRepository from '../repositories/SettingsRepository.js';
import { ValidationError } from '../utils/errors.js';

class SettingsService {
  /**
   * Get settings
   * Returns default settings if none exist
   */
  async getSettings() {
    const settings = await SettingsRepository.getSettings();
    
    // Return default settings if none exist
    if (!settings) {
      return {
        dashboardInsight: '',
        lastAnalyzed: ''
      };
    }
    
    return settings;
  }

  /**
   * Update or create settings
   * If settings don't exist, create them; otherwise update
   */
  async updateSettings(settingsData) {
    // Validate settings data
    this.validateSettingsData(settingsData);

    const existingSettings = await SettingsRepository.getSettings();
    
    if (!existingSettings) {
      // Create new settings
      return await SettingsRepository.createSettings(settingsData);
    } else {
      // Update existing settings
      return await SettingsRepository.updateSettings(existingSettings.id, settingsData);
    }
  }

  /**
   * Update dashboard insight
   */
  async updateDashboardInsight(insight) {
    const existingSettings = await SettingsRepository.getSettings();
    
    const settingsData = {
      dashboardInsight: insight,
      lastAnalyzed: new Date().toISOString()
    };
    
    if (!existingSettings) {
      return await SettingsRepository.createSettings(settingsData);
    } else {
      return await SettingsRepository.updateSettings(existingSettings.id, settingsData);
    }
  }

  /**
   * Validate settings data
   */
  validateSettingsData(data) {
    const errors = [];

    if (data.dashboardInsight && typeof data.dashboardInsight !== 'string') {
      errors.push({ field: 'dashboardInsight', message: 'Dashboard insight must be a string' });
    }

    if (data.lastAnalyzed && typeof data.lastAnalyzed !== 'string') {
      errors.push({ field: 'lastAnalyzed', message: 'Last analyzed must be a string (ISO date)' });
    }

    if (errors.length > 0) {
      throw new ValidationError('Settings validation failed', errors);
    }
  }
}

export default new SettingsService();

