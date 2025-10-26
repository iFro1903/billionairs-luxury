// Sentry Error Tracking Konfiguration
// Production Error Monitoring für Vercel Edge Runtime
// Verwendet direkte HTTP API (SDK-frei für Edge Runtime Kompatibilität)

/**
 * Sendet Error direkt an Sentry via HTTP API
 * Edge Runtime kompatibel - kein SDK nötig
 */
async function sendToSentry(error, context = {}) {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  try {
    // Parse DSN: https://PUBLIC_KEY@SENTRY_HOST/PROJECT_ID
    const dsnMatch = process.env.SENTRY_DSN.match(/https:\/\/(.+)@(.+)\/(\d+)/);
    if (!dsnMatch) return;

    const [, publicKey, sentryHost, projectId] = dsnMatch;
    const sentryUrl = `https://${sentryHost}/api/${projectId}/store/`;

    // Sentry Event Format
    const event = {
      event_id: crypto.randomUUID().replace(/-/g, ''),
      timestamp: Date.now() / 1000,
      platform: 'javascript',
      level: 'error',
      environment: process.env.VERCEL_ENV || 'development',
      release: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      exception: {
        values: [{
          type: error.name || 'Error',
          value: error.message,
          stacktrace: {
            frames: parseStackTrace(error.stack)
          }
        }]
      },
      tags: {
        runtime: 'edge',
        ...context.tags
      },
      extra: context.extra || {},
      request: context.request || {}
    };

    // Sende an Sentry
    await fetch(sentryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${publicKey}, sentry_client=custom-edge/1.0`
      },
      body: JSON.stringify(event)
    });

    console.log('🔴 Error sent to Sentry:', error.message);
  } catch (err) {
    console.error('❌ Failed to send to Sentry:', err);
  }
}

/**
 * Parse Stack Trace für Sentry Format
 */
function parseStackTrace(stack) {
  if (!stack) return [];
  
  return stack.split('\n').slice(1).map(line => {
    const match = line.match(/at (.+?) \((.+?):(\d+):(\d+)\)/);
    if (match) {
      return {
        function: match[1],
        filename: match[2],
        lineno: parseInt(match[3]),
        colno: parseInt(match[4])
      };
    }
    return { function: line.trim() };
  }).filter(f => f.function);
}

/**
 * Captured einen Error und sendet ihn zu Sentry
 * @param {Error} error - Der Error der geloggt werden soll
 * @param {Object} context - Zusätzlicher Context (user, payment, etc.)
 */
export function captureError(error, context = {}) {
  if (!process.env.SENTRY_DSN) {
    console.error('❌ Sentry Error (DSN missing):', error);
    return;
  }

  sendToSentry(error, context);
}

/**
 * Captured eine Message (kein Error) zu Sentry
 * Nützlich für Warnings oder wichtige Events
 */
export function captureMessage(message, level = 'info', context = {}) {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  const fakeError = new Error(message);
  fakeError.name = level.toUpperCase();
  sendToSentry(fakeError, context);
}

/**
 * Wrapper für API Routes mit automatischem Error Tracking
 * @param {Function} handler - Die API Route Handler Function
 */
export function withSentry(handler) {
  return async (req) => {
    try {
      return await handler(req);
    } catch (error) {
      // Extrahiere nützliche Request-Infos
      const url = new URL(req.url);
      const context = {
        tags: {
          method: req.method,
          endpoint: url.pathname,
        },
        extra: {
          url: req.url,
          method: req.method,
          headers: Object.fromEntries(req.headers),
        },
        request: {
          url: req.url,
          method: req.method,
          query_string: url.search,
          headers: Object.fromEntries(req.headers),
        }
      };

      captureError(error, context);
      
      // Gebe User-freundliche Error-Response zurück
      return new Response(
        JSON.stringify({ 
          error: 'Internal Server Error',
          message: process.env.VERCEL_ENV === 'development' 
            ? error.message 
            : 'Something went wrong. Our team has been notified.'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}

export default { captureError, captureMessage, withSentry };
