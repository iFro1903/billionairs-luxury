# Push Notifications Setup Guide

## 1. VAPID Keys in Vercel hinzufügen

Die generierten VAPID Keys müssen als Environment Variables in Vercel hinzugefügt werden:

### In Vercel Dashboard:
1. Gehe zu: https://vercel.com/ifro1903/billionairs-luxury/settings/environment-variables
2. Füge folgende Variables hinzu:

```
VAPID_PUBLIC_KEY=BImYUR7FiZgYywJNjKzSiIkDPdotF5OX5E1h023JBKk4Yr6nSnIzq6OD5PDNKLSl-UK1xxoFFY4uWWPyNAJaoGs
VAPID_PRIVATE_KEY=MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg89uqZ2jEbaanMXXXtWYm6S07ppE926xpXJBrCAY7w4OhRANCAASJmFEexYmYGMsCTYys0oiJAz3aLReTl-RNYdNtyQSpOGK-p0pyM6ujg-TwzSi0pflCtccaBRWOLllj8jQCWqBr
VAPID_SUBJECT=mailto:furkan_akaslan@hotmail.com
```

3. Wähle **All Environments** (Production, Preview, Development)
4. Klicke **Save**
5. **Redeploy** auslösen

## 2. Datenbank Migration ausführen

```sql
-- In Neon SQL Editor ausführen:
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255),
    endpoint TEXT NOT NULL UNIQUE,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    user_agent TEXT,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_notification_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_push_subscriptions_email ON push_subscriptions(user_email);
CREATE INDEX idx_push_subscriptions_active ON push_subscriptions(is_active) WHERE is_active = true;
```

## 3. Notification Permission anfragen

Nach erfolgreicher Zahlung oder Login wird automatisch um Permission gebeten.

## 4. Test Notification senden

```bash
# API Call zum Testen:
POST https://www.billionairs.luxury/api/send-notification

Headers:
Authorization: Bearer <ADMIN_TOKEN>

Body:
{
  "title": "🎉 Welcome to BILLIONAIRS",
  "message": "Your exclusive experience awaits.",
  "url": "/dashboard"
}
```

## 5. Use Cases

- ✅ **Zahlungsbestätigung**: Nach erfolgreicher Stripe-Zahlung
- ✅ **Chat Nachricht**: Neue Nachricht vom CEO
- ✅ **Easter Egg**: Verstecktes Feature freigeschaltet
- ✅ **Exklusiver Content**: Neuer Content verfügbar

## Security

- ⚠️ **VAPID_PRIVATE_KEY niemals committen**
- ✅ Nur in Vercel Environment Variables speichern
- ✅ Subscriptions sind user-spezifisch
- ✅ Können jederzeit widerrufen werden

## Browser Support

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari 16.4+ (macOS, iOS)
- ❌ iOS Safari < 16.4

## Testing

1. Öffne https://www.billionairs.luxury
2. Nach Login → "Allow Notifications" klicken
3. Im Admin Panel → "Send Test Notification"
4. Notification sollte erscheinen (auch wenn Tab geschlossen)
