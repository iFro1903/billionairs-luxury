import { withSentry } from '../lib/sentry.js';

export const config = { runtime: 'edge' };

export default withSentry(async function handler(req) {
  // This endpoint intentionally throws an error so you can verify Sentry integration.
  throw new Error('Sentry test error: intentional test from /api/sentry-test');
});
