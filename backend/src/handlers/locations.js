import { jsonResponse } from '../utils/response.js';
import { toCamelCase, toCamelCaseArray } from '../utils/casing.js';

export async function handleGetLocations({ db, corsHeaders }) {
  try {
    const locations = await db
      .prepare('SELECT * FROM locations ORDER BY id')
      .all();

    return jsonResponse(toCamelCaseArray(locations.results || []), 200, corsHeaders);
  } catch (error) {
    console.error('Get locations error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleCreateLocation({ body, db, corsHeaders }) {
  try {
    const { id, name, address } = body;

    if (!id || !name) {
      return jsonResponse(
        { error: 'Validation Error', message: 'Missing required fields' },
        400,
        corsHeaders
      );
    }

    await db
      .prepare('INSERT INTO locations (id, name, address) VALUES (?, ?, ?)')
      .bind(id, name, address || null)
      .run();

    const created = await db
      .prepare('SELECT * FROM locations WHERE id = ?')
      .bind(id)
      .first();

    return jsonResponse(toCamelCase(created), 201, corsHeaders);
  } catch (error) {
    console.error('Create location error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleGetLocation({ params, db, corsHeaders }) {
  const locationId = params.id;
  try {
    const location = await db
      .prepare('SELECT * FROM locations WHERE id = ?')
      .bind(locationId)
      .first();

    if (!location) {
      return jsonResponse(
        { error: 'Not Found', message: 'Location not found' },
        404,
        corsHeaders
      );
    }

    return jsonResponse(toCamelCase(location), 200, corsHeaders);
  } catch (error) {
    console.error('Get location error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleUpdateLocation({ params, body, db, corsHeaders }) {
  const locationId = params.id;
  try {
    const { name, address } = body;

    await db
      .prepare('UPDATE locations SET name = ?, address = ? WHERE id = ?')
      .bind(name, address, locationId)
      .run();

    const updated = await db
      .prepare('SELECT * FROM locations WHERE id = ?')
      .bind(locationId)
      .first();

    if (!updated) {
      return jsonResponse(
        { error: 'Not Found', message: 'Location not found' },
        404,
        corsHeaders
      );
    }

    return jsonResponse(toCamelCase(updated), 200, corsHeaders);
  } catch (error) {
    console.error('Update location error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}

export async function handleDeleteLocation({ params, db, corsHeaders }) {
  const locationId = params.id;
  try {
    await db
      .prepare('DELETE FROM locations WHERE id = ?')
      .bind(locationId)
      .run();

    return new Response(null, { status: 204, headers: corsHeaders });
  } catch (error) {
    console.error('Delete location error:', error);
    return jsonResponse(
      { error: 'Internal Server Error', message: error.message },
      500,
      corsHeaders
    );
  }
}
