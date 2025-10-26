# Quick Setup Guide - Push Notifications

## ✅ Schritt 1: Vercel Environment Variables

**Link:** https://vercel.com/ifro1903/billionairs-luxury/settings/environment-variables

### Variables hinzufügen:

1. **VAPID_PUBLIC_KEY**
   ```
   BImYUR7FiZgYywJNjKzSiIkDPdotF5OX5E1h023JBKk4Yr6nSnIzq6OD5PDNKLSl-UK1xxoFFY4uWWPyNAJaoGs
   ```
   - Environment: ✅ Production ✅ Preview ✅ Development

2. **VAPID_PRIVATE_KEY**
   ```
   MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg89uqZ2jEbaanMXXXtWYm6S07ppE926xpXJBrCAY7w4OhRANCAASJmFEexYmYGMsCTYys0oiJAz3aLReTl-RNYdNtyQSpOGK-p0pyM6ujg-TwzSi0pflCtccaBRWOLllj8jQCWqBr
   ```
   - Environment: ✅ Production ✅ Preview ✅ Development

3. **VAPID_SUBJECT**
   ```
   mailto:furkan_akaslan@hotmail.com
   ```
   - Environment: ✅ Production ✅ Preview ✅ Development

Nach dem Speichern: **Redeploy triggern!**

---

## ✅ Schritt 2: Neon Database Migration

**Link:** https://console.neon.tech

### SQL ausführen:

```sql
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

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_email 
    ON push_subscriptions(user_email);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active 
    ON push_subscriptions(is_active) 
    WHERE is_active = true;
```

### Verify:
```sql
SELECT COUNT(*) FROM push_subscriptions;
```
Sollte `0` zurückgeben (leere Tabelle).

---

## ✅ Schritt 3: Testen

1. Öffne: https://www.billionairs.luxury
2. Öffne Browser Console (F12)
3. Führe aus:
   ```javascript
   await window.pushManager.subscribe();
   ```
4. Klicke "Allow" wenn Browser nach Permission fragt
5. Sollte sehen: `✅ Push subscription created`

### Test Notification senden:
```javascript
await window.pushManager.showTestNotification();
```

---

## 🎉 Fertig!

Sobald beide Schritte abgeschlossen sind, funktionieren Push Notifications!

**Use Cases:**
- 💳 Nach erfolgreicher Zahlung
- 💬 Neue Chat-Nachricht
- 🎁 Easter Egg freigeschaltet
- ⭐ Exklusiver Content verfügbar
