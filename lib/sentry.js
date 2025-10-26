// Sentry Error Tracking Konfiguration
// Production Error Monitoring für Vercel Edge Runtime

import * as Sentry from '@sentry/browser';

let sentryInitialized = false;

/**
 * Initialisiert Sentry mit DSN aus Environment Variable
 * Nur einmal pro Serverless-Instanz ausgeführt
 */
export function initSentry() {
  if (sentryInitialized || !process.env.SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV || 'development',
    
    // Performance Monitoring (reduziert für Edge Runtime)
    tracesSampleRate: process.env.VERCEL_ENV === 'production' ? 0.1 : 1.0,
    
    // Release Tracking
    release: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    
    // Ignore bekannte Fehler
    ignoreErrors: [
      'Non-Error promise rejection captured',
      'ResizeObserver loop limit exceeded',
    ],
  });

  sentryInitialized = true;
  console.log('✅ Sentry initialized:', process.env.VERCEL_ENV);
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

  initSentry();

  // Setze Context für bessere Error-Analyse
  if (context.user) {
    Sentry.setUser({ email: context.user });
  }
  
  if (context.tags) {
    Sentry.setTags(context.tags);
  }
  
  if (context.extra) {
    Sentry.setContext('additional', context.extra);
  }

  Sentry.captureException(error);
  console.error('🔴 Error captured by Sentry:', error.message);
}

/**
 * Captured eine Message (kein Error) zu Sentry
 * Nützlich für Warnings oder wichtige Events
 */
export function captureMessage(message, level = 'info', context = {}) {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  initSentry();
  
  if (context.tags) {
    Sentry.setTags(context.tags);
  }

  Sentry.captureMessage(message, level);
}

/**
 * Wrapper für API Routes mit automatischem Error Tracking
 * @param {Function} handler - Die API Route Handler Function
 */
export function withSentry(handler) {
  return async (req) => {
    initSentry();

    try {
      return await handler(req);
    } catch (error) {
      // Extrahiere nützliche Request-Infos
      const context = {
        tags: {
          method: req.method,
          url: req.url,
        },
        extra: {
          headers: req.headers,
          query: new URL(req.url, 'http://localhost').searchParams.toString(),
        },
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

export default Sentry;
