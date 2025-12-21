import { jsonResponse } from '../utils/response.js';

export async function handleGetSettings({ db, corsHeaders }) {
  try {
    const settings = await db
      .prepare('SELECT * FROM settings LIMIT 1')
      .first();

    return jsonResponse(settings || {}, 200, corsHeaders);
  } catch (error) {
    console.error('Get settings error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleUpdateSettings({ body, db, corsHeaders }) {
  const { dashboardInsight, lastAnalyzed, insightAutoUpdateHours } = body;

  try {
    await db
      .prepare('UPDATE settings SET dashboard_insight = ?, last_analyzed = ?, insight_auto_update_hours = ?')
      .bind(dashboardInsight || '', lastAnalyzed || '', insightAutoUpdateHours || 12)
      .run();

    const updated = await db
      .prepare('SELECT * FROM settings LIMIT 1')
      .first();

    return jsonResponse(updated || {}, 200, corsHeaders);
  } catch (error) {
    console.error('Update settings error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}
