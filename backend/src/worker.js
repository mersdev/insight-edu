/**
 * Cloudflare Worker - Insight EDU Backend
 * Main entry point for the Cloudflare Workers application
 */

import { handleRequest } from './router.js';

export default {
  fetch: handleRequest,
};
