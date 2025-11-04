# 🚨 Sentry Error Monitoring Setup

Sentry provides real-time error tracking and performance monitoring for BILLIONAIRS LUXURY.

## Why Sentry?

- **Real-Time Alerts**: Get notified immediately when errors occur
- **Stack Traces**: See exactly where and why errors happen
- **Performance Monitoring**: Track API response times and bottlenecks
- **User Context**: Know which user experienced the error
- **Edge Runtime Compatible**: Works with Vercel Edge Functions

## Setup Instructions

### 1. Create Sentry Account

1. Go to [sentry.io](https://sentry.io)
2. Sign up (free tier available)
3. Create new project → Select "JavaScript"
4. Choose "Vercel" as platform

### 2. Get Your DSN

1. Navigate to: **Settings → Projects → [Your Project] → Client Keys (DSN)**
2. Copy the DSN (looks like): `https://abc123def456@o123456.ingest.sentry.io/7890123`

### 3. Add to Environment Variables

#### Local Development (.env)
```bash
SENTRY_DSN=https://your-dsn-here@sentry.io/project-id
```

#### Vercel Production
```bash
# Add via Vercel Dashboard or CLI
vercel env add SENTRY_DSN

# Or via CLI:
vercel env add SENTRY_DSN production
# Paste your DSN when prompted
```

### 4. Verify Integration

The Sentry integration is already implemented in `/lib/sentry.js`. Once you add the DSN:

1. Deploy to Vercel
2. Trigger an error (e.g., visit `/api/test-error`)
3. Check Sentry dashboard for the error

## Features Already Implemented

✅ **Error Capturing**: All API errors are automatically sent to Sentry  
✅ **Edge Runtime Support**: Custom HTTP implementation (no SDK needed)  
✅ **Context Tags**: Each error includes:
- Environment (development/production)
- Git commit SHA
- API endpoint
- User IP
- Custom context

✅ **Error Filtering**: Only sends errors in production (not dev)

## Usage in Code

Sentry is automatically used in all API endpoints:

```javascript
import { captureError, captureMessage } from '../lib/sentry.js';

try {
    // Your code
} catch (error) {
    captureError(error, {
        tags: { category: 'payment', endpoint: 'stripe-checkout' },
        extra: { userId: user.id, amount: 500000 }
    });
    throw error;
}
```

## Alert Configuration

Recommended alerts to set up in Sentry:

1. **Payment Failures** (tag: `category:payment`)
2. **5xx Server Errors** (status: `500-599`)
3. **Rate Limit Violations** (tag: `category:rate-limit`)
4. **Admin Login Failures** (tag: `endpoint:admin-auth`)

Configure alerts in: **Settings → Alerts → Create Alert Rule**

## Performance Monitoring (Optional)

Upgrade to Sentry Performance plan for:
- API endpoint response times
- Database query performance
- Vercel Edge Function cold starts

## Cost

- **Free Tier**: 5,000 errors/month (sufficient for most small projects)
- **Team Plan**: $26/month - 50,000 errors
- **Business Plan**: $80/month - Unlimited errors

## Testing

```bash
# Test error tracking
curl https://billionairs.luxury/api/test-error

# Check Sentry dashboard for the error
```

## Disable Sentry

To disable Sentry temporarily:

1. Remove `SENTRY_DSN` from environment variables
2. Errors will be logged to console only

## Support

- [Sentry Documentation](https://docs.sentry.io/)
- [Vercel + Sentry Guide](https://vercel.com/guides/using-sentry-with-vercel)
- [Edge Runtime Compatibility](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#edge-runtime)
