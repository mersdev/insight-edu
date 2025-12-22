import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('backendApi.sendStudentReportEmail', () => {
  beforeEach(() => {
    vi.resetModules();
    const storage = (globalThis as any).localStorage;
    if (storage && typeof storage.clear === 'function') {
      storage.clear();
    } else {
      (globalThis as any).localStorage = {
        store: {},
        getItem(key: string) {
          return this.store[key] || null;
        },
        setItem(key: string, value: string) {
          this.store[key] = value;
        },
        removeItem(key: string) {
          delete this.store[key];
        },
        clear() {
          this.store = {};
        },
      };
    }
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'sent', to: 'dehoulworker+parent@gmail.com' }),
    });
  });

  it('sends request with auth header and message body', async () => {
    localStorage.setItem('authToken', 'token-123');
    const { api } = await import('./backendApi');

    await api.sendStudentReportEmail('s123', 'Progress summary');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:8787/api/v1/teacher/students/s123/report-email',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
        body: JSON.stringify({ message: 'Progress summary' }),
      })
    );
  });
});
