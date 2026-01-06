/**
 * Cloudflare Worker - Insight EDU Backend
 * Main entry point for the Cloudflare Workers application
 */

import { handleRequest } from './router.js';
import { performScheduledMaintenance } from './handlers/scheduler.js';

export default {
  fetch: handleRequest,
  scheduled: (event, env, ctx) => {
    const referenceDate = event?.scheduledTime ? new Date(event.scheduledTime) : new Date();
    const runPromise = (async () => {
      const result = await performScheduledMaintenance({ db: env.DB, referenceDate });
      console.log('Scheduled maintenance result:', JSON.stringify(result));
      return result;
    })().catch((error) => {
      console.error('Scheduled task failed:', error);
      return { error: error?.message || 'Unknown scheduler error' };
    });
    if (ctx?.waitUntil) {
      ctx.waitUntil(runPromise);
    } else {
      return runPromise;
    }
  },
};
