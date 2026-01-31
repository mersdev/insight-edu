/**
 * Student Insights API Tests (per-student, per-month)
 */

import worker from '../src/worker.js';
import { createMockEnv, createMockContext, createToken } from './helpers/testUtils.js';

describe('Student Insights API', () => {
  let mockEnv;
  let mockCtx;

  beforeEach(() => {
    mockEnv = createMockEnv();
    mockCtx = createMockContext();
  });

  test('should require reportMonthKey when saving insight', async () => {
    const token = createToken();
    const request = new Request('http://localhost/api/v1/teacher/student-insights', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        studentId: 's1',
        insights: [{ studentId: 's1', type: 'OVERALL', message: 'Test', date: new Date().toISOString() }],
        lastAnalyzed: new Date().toISOString(),
      }),
    });

    const response = await worker.fetch(request, mockEnv, mockCtx);
    expect(response.status).toBe(400);
  });

  test('should store and fetch insights per month', async () => {
    const token = createToken();
    const monthA = '2025-12';
    const monthB = '2026-01';

    const save = async (monthKey, message) => {
      const request = new Request('http://localhost/api/v1/teacher/student-insights', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          studentId: 's1',
          reportMonthKey: monthKey,
          insights: [{ studentId: 's1', type: 'OVERALL', message, date: new Date().toISOString() }],
          lastAnalyzed: new Date().toISOString(),
        }),
      });
      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(201);
    };

    await save(monthA, 'December insight');
    await save(monthB, 'January insight');

    const get = async (monthKey) => {
      const request = new Request(`http://localhost/api/v1/teacher/student-insights/s1?reportMonthKey=${monthKey}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const response = await worker.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(200);
      return response.json();
    };

    const dec = await get(monthA);
    const jan = await get(monthB);

    expect(dec.reportMonthKey).toBe(monthA);
    expect(dec.insights[0].message).toBe('December insight');
    expect(jan.reportMonthKey).toBe(monthB);
    expect(jan.insights[0].message).toBe('January insight');
  });
});
