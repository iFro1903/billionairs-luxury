/**
 * Sentry Error Tracking Configuration
 * Production Error Monitoring for Vercel Edge Runtime
 * Uses direct HTTP API (SDK-free for Edge Runtime compatibility)
 */

import type { SentryContext, SentryEvent, SentryStackFrame } from '../types/api.js';

/**
 * Sends Error directly to Sentry via HTTP API
 * Edge Runtime compatible - no SDK needed
 */
async function sendToSentry(error: Error, context: SentryContext = {}): Promise<void> {
  if (!process.env.SENTRY_DSN) {
    console.log('❌ No SENTRY_DSN configured');
    return;
  }

  try {
    console.log('🔍 Sending to Sentry, DSN:', process.env.SENTRY_DSN.substring(0, 30) + '...');
    
    // Parse DSN: https://PUBLIC_KEY@SENTRY_HOST/PROJECT_ID
    const dsnMatch = process.env.SENTRY_DSN.match(/https:\/\/(.+)@(.+)\/(\d+)/);
    if (!dsnMatch) {
      console.log('❌ Invalid DSN format');
      return;
    }

    const [, publicKey, sentryHost, projectId] = dsnMatch;
    console.log('✅ Parsed DSN - Project:', projectId, 'Host:', sentryHost);
    const sentryUrl = `https://${sentryHost}/api/${projectId}/store/`;

    // Sentry Event Format
    const event: SentryEvent = {
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
      request: context.request as {
        url: string;
        method: string;
        query_string?: string;
        headers?: Record<string, string>;
      }
    };

    // Send to Sentry
    const response = await fetch(sentryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${publicKey}, sentry_client=custom-edge/1.0`
      },
      body: JSON.stringify(event)
    });

    console.log('📤 Sentry Response Status:', response.status);
    if (!response.ok) {
      const text = await response.text();
      console.log('❌ Sentry Error Response:', text);
    } else {
      console.log('✅ Error sent to Sentry successfully!');
    }
  } catch (err) {
    const error = err as Error;
    console.error('❌ Failed to send to Sentry:', error.message);
  }
}

/**
 * Parse Stack Trace for Sentry Format
 */
function parseStackTrace(stack?: string): SentryStackFrame[] {
  if (!stack) return [];
  
  return stack.split('\n').slice(1).map(line => {
    const match = line.match(/at (.+?) \((.+?):(\d+):(\d+)\)/);
    if (match && match[1] && match[2] && match[3] && match[4]) {
      return {
        function: match[1],
        filename: match[2],
        lineno: parseInt(match[3], 10),
        colno: parseInt(match[4], 10),
        in_app: true
      };
    }
    return { function: line.trim(), in_app: false };
  }).filter(f => f.function);
}

/**
 * Captures an Error and sends it to Sentry
 * @param error - The error to be logged
 * @param context - Additional context (user, payment, etc.)
 */
export function captureError(error: Error, context: SentryContext = {}): void {
  console.error('🚨 Error captured:', error.message);
  
  if (process.env.SENTRY_DSN) {
    sendToSentry(error, context).catch(err => {
      console.error('Failed to send error to Sentry:', err);
    });
  }
}

/**
 * Captures a Message (not an Error) to Sentry
 * @param message - The message to log
 * @param context - Additional context
 */
export function captureMessage(message: string, context: SentryContext = {}): void {
  console.log('📝 Message captured:', message);
  
  if (process.env.SENTRY_DSN) {
    const syntheticError = new Error(message);
    sendToSentry(syntheticError, {
      ...context,
      tags: {
        ...context.tags,
        message_type: 'info'
      }
    }).catch(err => {
      console.error('Failed to send message to Sentry:', err);
    });
  }
}

/**
 * Wrapper for API Routes to automatically catch and report errors
 * @param handler - The API route handler
 * @returns Wrapped handler with error tracking
 */
export function withSentry<T extends Request>(
  handler: (req: T) => Promise<Response>
): (req: T) => Promise<Response> {
  return async (req: T): Promise<Response> => {
    try {
      return await handler(req);
    } catch (error) {
      const err = error as Error;
      
      // Extract request info
      const url = new URL(req.url);
      
      captureError(err, {
        tags: {
          endpoint: url.pathname,
          method: req.method,
          category: 'api_error'
        },
        extra: {
          url: req.url,
          headers: Object.fromEntries(req.headers.entries())
        },
        request: {
          url: req.url,
          method: req.method,
          query_string: url.search,
          headers: Object.fromEntries(req.headers.entries())
        }
      });

      // Return error response
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'Something went wrong. Our team has been notified.'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
  };
}
