═══════════════════════════════════════════════════════════════════════════════
  SENTRY ERROR TRACKING SETUP - Production Monitoring
═══════════════════════════════════════════════════════════════════════════════

🎯 **WARUM SENTRY?**
- Real-time Error Monitoring in Production
- Automatische Benachrichtigungen bei kritischen Fehlern
- Stack Traces + Context für schnelles Debugging
- Performance Monitoring (wie lange dauern API Calls?)
- 5,000 Errors/Monat KOSTENLOS (völlig ausreichend für Start)

═══════════════════════════════════════════════════════════════════════════════

📋 SCHRITT 1: SENTRY ACCOUNT ERSTELLEN
───────────────────────────────────────────────────────────────────────────────

1. Gehe zu: https://sentry.io/signup/
2. **Sign Up mit GitHub** (empfohlen) oder Email
3. Wähle:
   - Plan: **Developer (Free)** ← 5,000 events/month
   - Use Case: **Application Monitoring**

4. **Neues Projekt erstellen:**
   - Platform: **Node.js**
   - Project Name: `billionairs-luxury`
   - Team: Dein Team Name (oder "Personal")

5. Nach dem Erstellen siehst du den **DSN Key**:
   - Format: `https://xxxxxxxxxxxxx@o1234567.ingest.sentry.io/8765432`
   - ⚠️ **KOPIERE DIESEN KEY** - brauchst du gleich!

═══════════════════════════════════════════════════════════════════════════════

📋 SCHRITT 2: VERCEL ENVIRONMENT VARIABLE
───────────────────────────────────────────────────────────────────────────────

1. Gehe zu: https://vercel.com/ifro1903/billionairs-luxury/settings/environment-variables

2. Klicke **"Add New"**

3. Fülle aus:
   ```
   Name:  SENTRY_DSN
   
   Value: [Dein DSN Key von Sentry - Format: https://xxxxx@o123.ingest.sentry.io/456]
   
   Environments: 
   ✅ Production  
   ✅ Preview  
   ✅ Development
   ```

4. Klicke **"Save"**

5. **WICHTIG:** Redeploy triggern
   - Gehe zu "Deployments" Tab
   - Klicke beim letzten Deployment auf "..." → "Redeploy"
   - Warte bis "Ready" Status

═══════════════════════════════════════════════════════════════════════════════

✅ TESTING - SO PRÜFST DU OB ES FUNKTIONIERT
───────────────────────────────────────────────────────────────────────────────

### Test 1: Sentry Dashboard Check

1. Gehe zu: https://sentry.io/organizations/[dein-org]/projects/billionairs-luxury/
2. Klicke auf **"Issues"** im Menü
3. Wenn alles funktioniert, siehst du später hier Errors

### Test 2: Trigger einen Test-Error

1. Öffne deine Website Admin-Login
2. Versuche mit einem komplett falschen Password zu loggen (5x)
3. Gehe zu Sentry Dashboard → **Issues**
4. Nach ~30 Sekunden sollte ein Error erscheinen mit Details:
   - Endpoint: `admin-auth`
   - Error Message: Details zum Fehler
   - Stack Trace: Wo der Error passiert ist
   - Context: IP, Browser, etc.

### Test 3: Email Alerts (Optional)

1. In Sentry: **Settings** → **Alerts**
2. Create Alert Rule:
   - Name: "Critical Payment Errors"
   - Conditions: "When event.tag.category equals payment"
   - Actions: "Send email to [deine email]"
3. Nächster Payment-Error → Du bekommst sofort Email!

═══════════════════════════════════════════════════════════════════════════════

🎛️ SENTRY DASHBOARD - WICHTIGE FEATURES
───────────────────────────────────────────────────────────────────────────────

### Issues (Errors)
- **Alle Errors** in Echtzeit
- Grouped by: Ähnliche Errors werden zusammengefasst
- Click auf Error → Details:
  - Stack Trace (wo im Code?)
  - User Context (welcher User?)
  - Request Info (welche API?)
  - Breadcrumbs (was ist davor passiert?)

### Performance
- **API Response Times** 
- Langsame Endpoints identifizieren
- Transaction Traces (welche Funktion dauert am längsten?)

### Releases
- **Code-Version** zu jedem Error
- Siehe genau: "Error kam nach Deployment XYZ"
- Git Commit SHA automatisch getracked

═══════════════════════════════════════════════════════════════════════════════

📊 WAS WIRD GETRACKT?
───────────────────────────────────────────────────────────────────────────────

### Automatisch erfasste Errors:

1. **Admin Authentication** (api/admin-auth.js)
   - Password Hash Fehler
   - 2FA Verification Fehler
   - Database Connection Errors

2. **Stripe Webhooks** (api/stripe-webhook.js)
   - Signature Verification Failures
   - Payment Processing Errors
   - Database Update Failures

3. **Alle API Errors** mit Context:
   - Request Method (GET/POST)
   - Request URL + Query Params
   - Headers
   - User Email (wenn verfügbar)
   - IP Address
   - Timestamp

### Error Categories (Tags):

- `category:authentication` - Login/Auth Probleme
- `category:payment` - Stripe/Payment Fehler
- `category:config` - Environment Variable Fehler
- `category:database` - SQL/Neon Fehler
- `endpoint:[name]` - Welche API?

═══════════════════════════════════════════════════════════════════════════════

🚨 WICHTIGE ALERTS EINRICHTEN
───────────────────────────────────────────────────────────────────────────────

### Empfohlene Alert Rules:

**1. Payment Errors (KRITISCH)**
```
Name: Critical Payment Failures
Condition: event.tag.category equals "payment"
Action: Email + Slack (wenn du Slack hast)
```

**2. Authentication Errors**
```
Name: Auth System Down
Condition: event.tag.endpoint equals "admin-auth" AND count > 5 in 1 minute
Action: Email
```

**3. Database Connection Issues**
```
Name: Database Unreachable
Condition: event.message contains "DATABASE_URL"
Action: Email (URGENT)
```

═══════════════════════════════════════════════════════════════════════════════

💡 BEST PRACTICES
───────────────────────────────────────────────────────────────────────────────

### Do's ✅
- Check Sentry Dashboard **täglich** (besonders nach Deployments)
- Resolve/Archive Errors wenn gefixt
- Add Comments zu Errors (für dein Team)
- Use Releases für besseres Tracking
- Set up Email Alerts für kritische Errors

### Don'ts ❌
- Ignore Errors nur weil sie "selten" sind
- Log sensitive Data (Passwords, Credit Cards)
- Disable Sentry in Production
- Vergessen alte Issues zu resolven

═══════════════════════════════════════════════════════════════════════════════

🎯 ZUSAMMENFASSUNG
───────────────────────────────────────────────────────────────────────────────

☑ Sentry Account erstellt (2 Minuten)
☑ DSN Key kopiert
☑ SENTRY_DSN in Vercel hinzugefügt (1 Minute)
☑ Redeploy ausgelöst (1 Minute)
☑ Test-Error getriggert (30 Sekunden)
☑ Sentry Dashboard gecheckt

**TOTAL: ~5 Minuten**

═══════════════════════════════════════════════════════════════════════════════

Danach hast du **Production-Grade Error Monitoring** wie die großen Apps! 🚀

Jeder Error wird automatisch geloggt mit:
- ✅ Stack Trace
- ✅ User Context
- ✅ Request Details
- ✅ Environment (Production/Preview)
- ✅ Git Commit (welche Code-Version?)

**= Schnelleres Debugging + Bessere User Experience!**
