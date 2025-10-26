/**
 * Type Definitions for Billionairs Luxury App
 * 
 * Zentrale Type-Definitionen für API Requests, Responses und Datenmodelle
 */

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface AdminAuthRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface AdminAuthResponse {
  success: boolean;
  message: string;
  sessionToken?: string;
  requires2FA?: boolean;
}

export interface StripeWebhookEvent {
  id: string;
  object: 'event';
  type: string;
  data: {
    object: Record<string, unknown>;
  };
  account?: string;
}

// ============================================================================
// Database Models
// ============================================================================

export interface User {
  id: number;
  email: string;
  payment_status: 'pending' | 'completed' | 'failed';
  stripe_payment_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuditLog {
  id: number;
  timestamp: Date;
  action: string;
  user_email?: string;
  ip_address?: string;
  details?: Record<string, unknown>;
}

export interface RateLimit {
  id: number;
  ip: string;
  endpoint: string;
  window_start: Date;
  request_count: number;
}

export interface BlockedIP {
  id: number;
  ip: string;
  reason: string;
  blocked_at: Date;
  expires_at?: Date;
  is_active: boolean;
}

export interface TwoFactorAuth {
  id: number;
  user_email: string;
  secret: string;
  enabled: boolean;
  backup_codes?: string[];
  created_at: Date;
}

export interface MarketingEmail {
  id: number;
  email: string;
  subscribed: boolean;
  unsubscribe_token: string;
  subscribed_at: Date;
  unsubscribed_at?: Date;
}

export interface DatabaseBackup {
  id: number;
  backup_date: Date;
  table_name: string;
  row_count: number;
  status: 'success' | 'failed';
  error_message?: string;
}

// ============================================================================
// Sentry Types
// ============================================================================

export interface SentryContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  request?: {
    url?: string;
    method?: string;
    query_string?: string;
    headers?: Record<string, string>;
  };
}

export interface SentryStackFrame {
  filename?: string;
  function?: string;
  lineno?: number;
  colno?: number;
  in_app?: boolean;
}

export interface SentryEvent {
  event_id: string;
  timestamp: number;
  platform: string;
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  environment?: string;
  release?: string;
  exception: {
    values: Array<{
      type: string;
      value: string;
      stacktrace?: {
        frames: SentryStackFrame[];
      };
    }>;
  };
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  request?: {
    url: string;
    method: string;
    query_string?: string;
    headers?: Record<string, string>;
  };
}

// ============================================================================
// Vercel Edge Runtime Types
// ============================================================================

export interface EdgeRequest extends Request {
  geo?: {
    city?: string;
    country?: string;
    region?: string;
    latitude?: string;
    longitude?: string;
  };
  ip?: string;
}

export interface EdgeResponse extends Response {
  // Vercel-spezifische Response-Erweiterungen
}

// ============================================================================
// Utility Types
// ============================================================================

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export type Awaitable<T> = T | Promise<T>;

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

// ============================================================================
// Environment Variables
// ============================================================================

export interface EnvironmentVariables {
  // Database
  DATABASE_URL: string;

  // Authentication
  ADMIN_PASSWORD_HASH: string;
  ADMIN_EMAIL: string;

  // Stripe
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRODUCT_ID: string;

  // Sentry
  SENTRY_DSN?: string;

  // Upstash Redis
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;

  // Cron
  CRON_SECRET: string;

  // Vercel
  VERCEL_ENV?: 'production' | 'preview' | 'development';
  VERCEL_URL?: string;
  VERCEL_GIT_COMMIT_SHA?: string;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvironmentVariables {}
  }
}
