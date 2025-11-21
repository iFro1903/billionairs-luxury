# STRIPE WEBHOOK SETUP - KRITISCH FÜR AUTOMATISCHE PAYMENT-ERKENNUNG

## ⚠️ PROBLEM
Die Zahlung kommt bei Stripe an, aber die Datenbank wird NICHT automatisch aktualisiert.

## ✅ LÖSUNG: Stripe Webhook konfigurieren

### Schritt 1: Gehe zu Stripe Dashboard
https://dashboard.stripe.com/webhooks

### Schritt 2: Klicke auf "Add endpoint"

### Schritt 3: Webhook URL eingeben:
```
https://billionairs-luxury.vercel.app/api/stripe-webhook
```

### Schritt 4: Events auswählen:
Klicke auf "Select events" und wähle:
- ✅ checkout.session.completed
- ✅ payment_intent.succeeded
- ✅ payment_intent.payment_failed
- ✅ charge.refunded

### Schritt 5: Signing Secret kopieren
Nach dem Erstellen zeigt Stripe ein "Signing secret" (whsec_...)
Dieses MUSS in Vercel als Environment Variable gespeichert werden!

### Schritt 6: Vercel Environment Variable setzen
1. Gehe zu: https://vercel.com/ifro1903/billionairs-luxury/settings/environment-variables
2. Füge hinzu:
   - Name: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_...` (von Stripe kopiert)
   - Environment: Production, Preview, Development
3. Klicke "Save"
4. Re-deploy triggern (oder warte auf nächsten Push)

## 🔍 WEBHOOK TESTEN

Nach der Konfiguration:

1. Gehe zu Stripe Dashboard → Webhooks
2. Klicke auf deinen Webhook
3. Tab "Testing" öffnen
4. Klicke "Send test webhook"
5. Event auswählen: `checkout.session.completed`
6. Payload anpassen (Email ändern zu deiner)
7. "Send test webhook" klicken

### Erfolgreiche Response sollte sein:
- Status: 200 OK
- Response: `{"received":true}`

## 🚨 OHNE WEBHOOK = KEINE AUTOMATISCHE AKTIVIERUNG!

Der Webhook ist das HERZSTÜCK des Systems. Ohne ihn:
- ❌ Zahlung wird nicht erkannt
- ❌ User bleibt auf "pending"
- ❌ Keine Bestätigungs-Email
- ❌ Kein automatischer Zugang

## 📋 CHECKLISTE

- [ ] Webhook URL in Stripe hinzugefügt
- [ ] Events checkout.session.completed + payment_intent.succeeded aktiviert
- [ ] Signing Secret kopiert
- [ ] STRIPE_WEBHOOK_SECRET in Vercel gespeichert
- [ ] Test-Webhook versendet → 200 OK Response
- [ ] Test-Zahlung mit Stripe Test-Karte gemacht
- [ ] User automatisch auf "paid" gesetzt ✅

## 🧪 TEST-ZAHLUNG DURCHFÜHREN

Stripe Test-Karte:
```
Kartennummer: 4242 4242 4242 4242
Ablaufdatum: 12/34
CVC: 123
PLZ: 12345
```

Flow:
1. Ausloggen
2. Neu registrieren mit Test-Email
3. "Complete Payment" klicken
4. Test-Karte eingeben
5. Zahlung abschließen
6. **ERWARTUNG: Automatisch auf Dashboard → Status "Access Granted"**

## 🔧 DEBUGGING

Webhook Logs in Stripe checken:
https://dashboard.stripe.com/webhooks → Dein Webhook → "Events" Tab

Bei Fehler:
- Response Code prüfen (sollte 200 sein)
- Request/Response Details ansehen
- Vercel Logs checken: https://vercel.com/ifro1903/billionairs-luxury/logs

## 💡 WICHTIG

Die Webhook-URL MUSS öffentlich erreichbar sein!
- ✅ https://billionairs-luxury.vercel.app/api/stripe-webhook (PRODUCTION)
- ❌ localhost funktioniert NICHT (außer mit Stripe CLI für lokale Tests)
