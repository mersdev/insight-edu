/**
 * Rating Categories API Tests
 */

import worker from '../src/worker.js';
import { createToken, createMockEnv, createMockContext } from './helpers/testUtils.js';

describe('Rating Categories API', () => {
  let mockEnv;
  let mockCtx;
  let adminToken;

  beforeEach(() => {
    mockEnv = createMockEnv();
    mockCtx = createMockContext();
    adminToken = createToken('admin', 'admin@edu.com', 'HQ');
  });

  test('GET /api/v1/admin/rating-categories returns available categories', async () => {
    const request = new Request('http://localhost/api/v1/admin/rating-categories', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const response = await worker.fetch(request, mockEnv, mockCtx);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Attention' }),
      ])
    );
  });

  test('POST /api/v1/admin/rating-categories can create a new category', async () => {
    const payload = { name: 'Resilience', description: 'Ability to bounce back' };
    const request = new Request('http://localhost/api/v1/admin/rating-categories', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const response = await worker.fetch(request, mockEnv, mockCtx);
    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data).toMatchObject({
      name: 'Resilience',
      description: 'Ability to bounce back',
    });
  });

  test('PUT /api/v1/admin/rating-categories/:id updates a category', async () => {
    const updatedDescription = 'Updated focus description';
    const request = new Request('http://localhost/api/v1/admin/rating-categories/1', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Attention', description: updatedDescription }),
    });

    const response = await worker.fetch(request, mockEnv, mockCtx);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toMatchObject({
      id: 1,
      name: 'Attention',
      description: updatedDescription,
    });
  });

  test('DELETE /api/v1/admin/rating-categories/:id removes a category', async () => {
    const createRequest = new Request('http://localhost/api/v1/admin/rating-categories', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Patience', description: 'Calm and steady' }),
    });

    const createResponse = await worker.fetch(createRequest, mockEnv, mockCtx);
    const created = await createResponse.json();

    const deleteRequest = new Request(`http://localhost/api/v1/admin/rating-categories/${created.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const deleteResponse = await worker.fetch(deleteRequest, mockEnv, mockCtx);
    expect(deleteResponse.status).toBe(204);

    const listRequest = new Request('http://localhost/api/v1/admin/rating-categories', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listResponse = await worker.fetch(listRequest, mockEnv, mockCtx);
    const categories = await listResponse.json();
    expect(categories.find((category) => category.id === created.id)).toBeUndefined();
  });
});
