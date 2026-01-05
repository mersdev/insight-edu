export const DEFAULT_RATING_CATEGORIES = [
  { name: 'Attention', description: 'Focus and concentration' },
  { name: 'Participation', description: 'Level of engagement' },
  { name: 'Homework', description: 'Homework completion and quality' },
  { name: 'Behavior', description: 'General conduct' },
  { name: 'Practice', description: 'Practice habits and effort' },
];

export async function ensureRatingCategoriesTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS rating_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

export async function ensureDefaultRatingCategories(db) {
  const countRow = await db
    .prepare('SELECT COUNT(*) AS total FROM rating_categories')
    .first();
  const existingCount = typeof countRow?.total === 'number' ? countRow.total : 0;
  if (existingCount > 0) {
    return;
  }

  for (const category of DEFAULT_RATING_CATEGORIES) {
    await db
      .prepare('INSERT OR IGNORE INTO rating_categories (name, description) VALUES (?, ?)')
      .bind(category.name, category.description)
      .run();
  }
}

export async function ensureRatingCategoriesInfrastructure(db) {
  await ensureRatingCategoriesTable(db);
  await ensureDefaultRatingCategories(db);
}
