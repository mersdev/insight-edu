/**
 * SettingsRepository
 * Data access layer for settings operations
 */

import { BaseRepository } from './BaseRepository.js';

class SettingsRepository extends BaseRepository {
  constructor() {
    super('settings');
  }

  /**
   * Transform database row to camelCase object
   */
  transformRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      dashboardInsight: row.dashboard_insight,
      lastAnalyzed: row.last_analyzed,
      insightAutoUpdateHours: row.insight_auto_update_hours || 12
    };
  }

  /**
   * Get settings (there should only be one record)
   */
  async getSettings() {
    const query = 'SELECT * FROM settings LIMIT 1';
    const result = await this.executeQuery(query);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Create settings
   */
  async createSettings(settingsData) {
    const { dashboardInsight, lastAnalyzed, insightAutoUpdateHours } = settingsData;

    const query = `
      INSERT INTO settings (dashboard_insight, last_analyzed, insight_auto_update_hours)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await this.executeQuery(query, [
      dashboardInsight,
      lastAnalyzed,
      insightAutoUpdateHours || 12
    ]);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Update settings
   */
  async updateSettings(id, settingsData) {
    const { dashboardInsight, lastAnalyzed, insightAutoUpdateHours } = settingsData;

    const query = `
      UPDATE settings
      SET dashboard_insight = COALESCE($2, dashboard_insight),
          last_analyzed = COALESCE($3, last_analyzed),
          insight_auto_update_hours = COALESCE($4, insight_auto_update_hours)
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.executeQuery(query, [
      id,
      dashboardInsight,
      lastAnalyzed,
      insightAutoUpdateHours
    ]);
    return this.transformRow(result.rows[0]);
  }

  /**
   * Check if settings exist
   */
  async settingsExist() {
    const query = 'SELECT EXISTS(SELECT 1 FROM settings)';
    const result = await this.executeQuery(query);
    return result.rows[0].exists;
  }
}

export default new SettingsRepository();

