# 🚀 BILLIONAIRS - Produktions-Deployment Anleitung

## 📋 Voraussetzungen für Live-Zahlungen

### 1. Stripe Account Setup
1. Gehen Sie zu https://dashboard.stripe.com/
2. Wechseln Sie von "Test mode" zu "Live mode" (Toggle oben rechts)
3. Navigieren Sie zu **Developers** → **API keys**
4. Kopieren Sie:
   - **Publishable key** (beginnt mit `pk_live_...`)
   - **Secret key** (beginnt mit `sk_live_...`)
   - ⚠️ **NIEMALS** den Secret Key öffentlich teilen oder committen!

### 2. Environment-Variablen Konfiguration

Öffnen Sie die Datei `.env` und ersetzen Sie die Platzhalter:

```env
# LIVE KEYS (für Produktion)
STRIPE_LIVE_SECRET_KEY=sk_live_IHR_ECHTER_SECRET_KEY_HIER
STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_IHR_ECHTER_PUBLISHABLE_KEY_HIER

# Environment
NODE_ENV=production

# Domain Configuration
DOMAIN=https://billionairs.luxury
SUCCESS_URL=https://billionairs.luxury/payment-success.html
CANCEL_URL=https://billionairs.luxury/payment-cancelled.html
```

### 3. Webhook Konfiguration

#### A. Webhook Endpoint erstellen
1. Gehen Sie zu https://dashboard.stripe.com/webhooks
2. Klicken Sie auf **"Add endpoint"**
3. Endpoint URL: `https://billionairs.luxury/webhook`
4. Wählen Sie Events aus:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
5. Klicken Sie auf **"Add endpoint"**

#### B. Webhook Secret kopieren
1. Nach dem Erstellen sehen Sie den **Signing secret** (beginnt mit `whsec_...`)
2. Fügen Sie ihn in `.env` ein:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_IHR_WEBHOOK_SECRET_HIER
   ```

### 4. Stripe Account Verifizierung

⚠️ **WICHTIG**: Für Zahlungen über 500,000 CHF muss Ihr Stripe-Account vollständig verifiziert sein:

1. **Business-Verifizierung**:
   - Firmendetails
   - Geschäftsdokumente
   - Identitätsnachweis der Geschäftsführung

2. **Bank-Verbindung**:
   - Schweizer Bankkonto für CHF-Auszahlungen
   - SEPA-Konto für EUR-Zahlungen

3. **Compliance**:
   - Anti-Geldwäsche (AML) Compliance
   - Know Your Customer (KYC) Verfahren
   - Für Beträge über 100,000 CHF sind zusätzliche Prüfungen erforderlich

4. **Limits erhöhen**:
   - Kontaktieren Sie Stripe Support
   - Anfrage für erhöhte Transaktionslimits
   - Begründung für 500,000 CHF Transaktionen

## 🔐 Sicherheits-Checkliste

- [ ] `.env` Datei ist in `.gitignore` enthalten
- [ ] Keine API Keys im Code hart-kodiert
- [ ] HTTPS ist aktiviert (SSL-Zertifikat)
- [ ] CORS ist auf Ihre Domain beschränkt
- [ ] Webhook-Signatur wird verifiziert
- [ ] Rate-Limiting ist konfiguriert
- [ ] Error-Logging ist aktiviert
- [ ] Backup-System ist eingerichtet

## 🌍 Server Deployment

### Option 1: VPS (Empfohlen für volle Kontrolle)

```powershell
# 1. Server vorbereiten (auf dem Server)
sudo apt update
sudo apt install nodejs npm nginx

# 2. Projekt hochladen
scp -r "Billionairs app neuer versuch 19.10" user@server:/var/www/billionairs

# 3. Dependencies installieren
cd /var/www/billionairs
npm install

# 4. PM2 für Prozess-Management
npm install -g pm2
pm2 start stripe-server.js --name billionairs
pm2 startup
pm2 save

# 5. Nginx als Reverse Proxy konfigurieren
# Siehe nginx-config.txt für Details
```

### Option 2: Heroku

```powershell
# 1. Heroku CLI installieren
# https://devcenter.heroku.com/articles/heroku-cli

# 2. App erstellen
heroku create billionairs-payment

# 3. Environment-Variablen setzen
heroku config:set NODE_ENV=production
heroku config:set STRIPE_LIVE_SECRET_KEY=sk_live_...
heroku config:set STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_...
heroku config:set DOMAIN=https://billionairs.luxury

# 4. Deployen
git push heroku main
```

### Option 3: Vercel / Netlify (Frontend)

Für statische Teile, Backend separat hosten.

## 💳 Cryptocurrency-Wallets (Optional)

Wenn Sie Crypto-Zahlungen akzeptieren möchten:

1. **Bitcoin Wallet**:
   - Hardware Wallet (Ledger/Trezor) empfohlen
   - Oder Business-Service wie BitPay, Coinbase Commerce

2. **Ethereum Wallet**:
   - MetaMask für Ethereum/ERC-20 Tokens
   - Oder Multi-Sig Wallet für zusätzliche Sicherheit

3. **USDT (Tether)**:
   - Entscheiden Sie: ERC-20 (Ethereum) oder TRC-20 (Tron)
   - Fügen Sie Wallet-Adressen in `.env` ein

4. **Payment Processor Integration**:
   - CoinGate: https://coingate.com/
   - BTCPay Server: https://btcpayserver.org/
   - Coinbase Commerce: https://commerce.coinbase.com/

## 🧪 Testing vor Live-Gang

### Test-Checklist:

1. **Test-Zahlung durchführen** (mit Test-Keys):
   ```
   Testkarten: https://stripe.com/docs/testing
   - 4242 4242 4242 4242 (Erfolg)
   - 4000 0000 0000 9995 (Fehlschlag)
   ```

2. **Webhook testen**:
   - Nutzen Sie Stripe CLI: `stripe listen --forward-to localhost:3000/webhook`
   - Oder: Stripe Dashboard → Webhooks → Send test webhook

3. **Error-Handling testen**:
   - Abgebrochene Zahlungen
   - Abgelehnte Karten
   - Netzwerk-Timeouts

4. **Performance testen**:
   - Load-Testing mit vielen gleichzeitigen Requests
   - Response-Zeiten messen

## 🚀 Live-Schaltung

### Schritt-für-Schritt:

1. **Environment umstellen**:
   ```powershell
   # In .env ändern:
   NODE_ENV=production
   ```

2. **Server neu starten**:
   ```powershell
   # Lokal
   npm run start:production
   
   # Auf Server mit PM2
   pm2 restart billionairs
   ```

3. **Monitoring aktivieren**:
   - Stripe Dashboard überwachen
   - Server-Logs checken: `pm2 logs billionairs`
   - Error-Tracking (z.B. Sentry) einrichten

4. **Erste Test-Transaktion**:
   - Mit echter Karte eine kleine Test-Zahlung machen
   - Webhook-Empfang überprüfen
   - Erfolgsseite testen

5. **Go-Live Ankündigung**:
   - Dokumentation für Support-Team
   - Notfall-Kontakte bereithalten
   - Stripe Support informieren über High-Value Transactions

## 📊 Monitoring & Maintenance

### Tägliche Checks:
- Stripe Dashboard auf neue Zahlungen prüfen
- Server-Health: `curl https://billionairs.luxury/health`
- Error-Logs durchsehen

### Wöchentlich:
- Backups überprüfen
- Security-Updates installieren
- Performance-Metriken analysieren

### Monatlich:
- Stripe Payout-Berichte
- Transaktions-Statistiken
- Compliance-Prüfungen

## 🆘 Support & Troubleshooting

### Stripe Support kontaktieren:
- E-Mail: support@stripe.com
- Dashboard → Help → Contact Support
- Für High-Value Accounts: Direkter Account Manager

### Häufige Probleme:

1. **"Webhook signature verification failed"**:
   - Prüfen Sie `STRIPE_WEBHOOK_SECRET` in `.env`
   - Webhook-Secret aus Dashboard kopieren

2. **"Payment declined"**:
   - Bank-Limits überprüfen
   - 3D Secure erforderlich
   - Kunde soll Bank kontaktieren

3. **"This payment method is not available"**:
   - Payment Method in Stripe Dashboard aktivieren
   - Land-Beschränkungen prüfen

4. **"Rate limit exceeded"**:
   - Zu viele API-Requests
   - Caching implementieren
   - Stripe kontaktieren für höhere Limits

## 📞 Kontakt

Bei Fragen zur Integration:
- Dokumentation: https://stripe.com/docs
- Support: support@stripe.com
- Community: https://github.com/stripe

---

**⚠️ WICHTIG**: Testen Sie ALLES ausführlich im Test-Modus, bevor Sie auf Live umstellen!

**Letzte Aktualisierung**: 21. Oktober 2025
