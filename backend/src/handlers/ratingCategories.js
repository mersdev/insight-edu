import { jsonResponse } from '../utils/response.js';
import { toCamelCaseArray, toCamelCase } from '../utils/casing.js';
import { ensureRatingCategoriesInfrastructure } from '../utils/ratingCategories.js';

export async function handleGetRatingCategories({ db, corsHeaders }) {
  try {
    await ensureRatingCategoriesInfrastructure(db);
    const result = await db.prepare('SELECT * FROM rating_categories ORDER BY id').all();
    return jsonResponse(toCamelCaseArray(result.results || []), 200, corsHeaders);
  } catch (error) {
    console.error('Get rating categories error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleCreateRatingCategory({ body, db, corsHeaders }) {
  try {
    await ensureRatingCategoriesInfrastructure(db);
    const { name, description } = body;
    if (!name || !name.trim()) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Name is required.' },
        400,
        corsHeaders
      );
    }

    const normalizedName = name.trim();
    await db
      .prepare('INSERT INTO rating_categories (name, description) VALUES (?, ?)')
      .bind(normalizedName, description || null)
      .run();

    const created = await db
      .prepare('SELECT * FROM rating_categories WHERE name = ?')
      .bind(normalizedName)
      .first();

    return jsonResponse(toCamelCase(created), 201, corsHeaders);
  } catch (error) {
    if (error?.message?.includes('UNIQUE constraint failed')) {
      return jsonResponse(
        { error: 'Conflict', message: 'Rating category already exists.' },
        409,
        corsHeaders
      );
    }
    console.error('Create rating category error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleUpdateRatingCategory({ params, body, db, corsHeaders }) {
  try {
    await ensureRatingCategoriesInfrastructure(db);
    const { id } = params;
    if (!id) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Category ID is required.' },
        400,
        corsHeaders
      );
    }

    const existing = await db
      .prepare('SELECT * FROM rating_categories WHERE id = ?')
      .bind(id)
      .first();

    if (!existing) {
      return jsonResponse(
        { error: 'Not Found', message: 'Rating category not found.' },
        404,
        corsHeaders
      );
    }

    const normalizedName = body.name ? body.name.trim() : existing.name;
    await db
      .prepare('UPDATE rating_categories SET name = ?, description = ? WHERE id = ?')
      .bind(normalizedName, body.description ?? existing.description, id)
      .run();

    const updated = await db
      .prepare('SELECT * FROM rating_categories WHERE id = ?')
      .bind(id)
      .first();

    return jsonResponse(toCamelCase(updated), 200, corsHeaders);
  } catch (error) {
    console.error('Update rating category error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleDeleteRatingCategory({ params, db, corsHeaders }) {
  try {
    await ensureRatingCategoriesInfrastructure(db);
    const { id } = params;
    if (!id) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Category ID is required.' },
        400,
        corsHeaders
      );
    }

    await db
      .prepare('DELETE FROM rating_categories WHERE id = ?')
      .bind(id)
      .run();

    return new Response(null, { status: 204, headers: corsHeaders });
  } catch (error) {
    console.error('Delete rating category error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}
