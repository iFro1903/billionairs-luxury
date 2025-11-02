# Payment Flow Test - Komplett-Durchlauf
**Datum:** 2. November 2025  
**Tester:** Furkan Akaslan

---

## 🎯 Test 1: Stripe Credit Card Payment

### Setup:
1. **Stripe Test Mode aktivieren**
   - Gehe zu: https://dashboard.stripe.com/test/developers
   - Verwende Test API Keys (sollten bereits konfiguriert sein)

### Test-Durchführung:

#### Schritt 1: Homepage öffnen
- [ ] Öffne: https://billionairs.luxury
- [ ] Scroll zu "Choose Your Payment Method"
- [ ] Prüfe: Alle 3 Payment-Optionen sichtbar?

#### Schritt 2: Payment-Formular ausfüllen
- [ ] Klicke auf **"Credit / Debit Card"**
- [ ] Fülle aus:
  - **First Name:** Test
  - **Last Name:** User
  - **Email:** test-$(date +%s)@example.com (einzigartig!)
  - **Password:** Test1234!
  - **Phone:** +41 79 123 45 67 (optional)

#### Schritt 3: Stripe Checkout
- [ ] Klicke auf **"Proceed to Secure Payment"**
- [ ] Wirst du zu Stripe Checkout weitergeleitet? ✅
- [ ] Prüfe Betrag: **CHF 700.00** oder **€650.00**?

#### Schritt 4: Test-Zahlung
Verwende Stripe Test Card:
```
Card Number: 4242 4242 4242 4242
Expiry: 12/34
CVC: 123
ZIP: 12345
```

- [ ] Zahlung durchführen
- [ ] Erfolgsmeldung von Stripe?

#### Schritt 5: Redirect zum Dashboard
- [ ] Wirst du zum Dashboard weitergeleitet?
- [ ] URL enthält: `?session_id=cs_test_...`?
- [ ] Steht: **"Dear Test User"** (nicht "Dear Member")?
- [ ] Status: **"ACCESS GRANTED"** (grün)?
- [ ] Member ID angezeigt?

#### Schritt 6: Download-Links testen
- [ ] "Download Your Premium Content" Button sichtbar?
- [ ] Klicke auf Download Button
- [ ] Download startet automatisch?
- [ ] Datei: `billionairs-premium-content.zip` heruntergeladen?

#### Schritt 7: Logout & Re-Login
- [ ] Logout vom Dashboard
- [ ] Gehe zu: https://billionairs.luxury/login.html
- [ ] Login mit Test-User E-Mail + Passwort
- [ ] Zugriff auf Dashboard? ✅
- [ ] Download-Link immer noch verfügbar?

---

## 🎯 Test 2: Stripe Webhook Verarbeitung

### Setup:
1. Gehe zu: https://dashboard.stripe.com/test/webhooks
2. Finde deinen Webhook: `https://billionairs.luxury/api/stripe-webhook`

### Test-Durchführung:

#### Schritt 1: Webhook Events prüfen
- [ ] Öffne: https://dashboard.stripe.com/test/events
- [ ] Filtere nach: `checkout.session.completed`
- [ ] Letztes Event öffnen
- [ ] **Event-Daten prüfen:**
  - `metadata.customer_email` = Test-User E-Mail?
  - `metadata.customer_name` = "Test User"?
  - `payment_status` = "paid"?

#### Schritt 2: Webhook Delivery prüfen
- [ ] Öffne Event → Tab "Webhooks"
- [ ] Status: **200 OK** (grüner Haken)?
- [ ] Oder: **4xx/5xx Fehler** (roter Fehler)?
- [ ] Response Body prüfen

#### Schritt 3: Datenbank prüfen (Neon)
- [ ] Öffne: https://console.neon.tech
- [ ] SQL Editor öffnen
- [ ] Query ausführen:
```sql
SELECT 
    email, 
    first_name, 
    last_name, 
    member_id, 
    payment_status, 
    created_at 
FROM users 
WHERE email = 'test-1730000000@example.com'  -- deine Test-Email
ORDER BY created_at DESC 
LIMIT 1;
```

**Erwartete Ergebnisse:**
- [ ] `first_name` = "Test"
- [ ] `last_name` = "User"
- [ ] `payment_status` = "paid"
- [ ] `member_id` beginnt mit "BILL-"

---

## 🎯 Test 3: Welcome Email

### Test-Durchführung:

#### Schritt 1: Postfach prüfen
- [ ] Öffne Postfach von Test-User E-Mail
- [ ] **Hinweis:** E-Mail kommt möglicherweise in **Spam/Junk**!
- [ ] E-Mail von: **BILLIONAIRS <noreply@billionairs.luxury>**
- [ ] Betreff: **"Welcome to BILLIONAIRS - Your Exclusive Access Credentials"**

#### Schritt 2: E-Mail Inhalt prüfen
- [ ] Anrede: **"Dear Test User"** (nicht "Dear Member")?
- [ ] Login-Credentials enthalten:
  - Email: test-xxx@example.com
  - Password: Test1234!
- [ ] Link zu Dashboard: https://billionairs.luxury/dashboard.html
- [ ] Unsubscribe Link vorhanden?

#### Schritt 3: E-Mail Links testen
- [ ] Klicke auf "Access Your Dashboard"
- [ ] Wirst du zum Dashboard weitergeleitet?
- [ ] Auto-Login funktioniert?

---

## 🎯 Test 4: Download-Links Sicherheit

### Test-Durchführung:

#### Schritt 1: Direkter Link-Test
- [ ] Kopiere Download-Link vom Dashboard
- [ ] Logout vom Dashboard
- [ ] Öffne Link in **Inkognito-Fenster** (ohne Login)
- [ ] **Erwartung:** Zugriff verweigert oder Redirect zu Login?

#### Schritt 2: Token Validation
- [ ] Gehe zu: https://billionairs.luxury/api/download?token=DEIN_TOKEN
- [ ] Ohne Login: **401 Unauthorized**?
- [ ] Mit Login: Download startet?

---

## 🎯 Test 5: Payment Workflow Edge Cases

### Test-Durchführung:

#### Test 5.1: Duplicate Email
- [ ] Versuche **dieselbe E-Mail nochmal** zu verwenden
- [ ] **Erwartung:** Fehlermeldung oder Update des existierenden Users?

#### Test 5.2: Payment Abbruch
- [ ] Starte Payment-Flow
- [ ] Klicke auf Stripe Checkout "Zurück" Button
- [ ] **Erwartung:** User wird NICHT erstellt, Status = "pending"?

#### Test 5.3: Fehlgeschlagene Zahlung
Verwende Stripe Decline Test Card:
```
Card Number: 4000 0000 0000 0002
Expiry: 12/34
CVC: 123
```
- [ ] Payment wird abgelehnt?
- [ ] Fehlermeldung angezeigt?
- [ ] User Status = "pending" (nicht "paid")?

---

## 🎯 Test 6: Session Management

### Test-Durchführung:

#### Schritt 1: Session Token
- [ ] Login erfolgreich
- [ ] Öffne Browser DevTools → Application → Cookies
- [ ] Cookie: `billionairs_token` vorhanden?
- [ ] Cookie: `HttpOnly`, `Secure` Flags gesetzt?

#### Schritt 2: Session Expiry
- [ ] Warte 24 Stunden (oder ändere Session-Timer temporär)
- [ ] Refresh Dashboard
- [ ] **Erwartung:** Redirect zu Login nach 24h?

#### Schritt 3: Multi-Tab Test
- [ ] Login in Tab 1
- [ ] Öffne Dashboard in Tab 2 (derselbe Browser)
- [ ] Logout in Tab 1
- [ ] Refresh Tab 2
- [ ] **Erwartung:** Tab 2 wird auch ausgeloggt?

---

## ✅ Checkliste - Alle Tests bestanden?

### Critical (MUSS funktionieren):
- [ ] Payment Flow komplett (Stripe Checkout)
- [ ] User Account wird erstellt
- [ ] Namen werden gespeichert (first_name, last_name)
- [ ] Dashboard zeigt korrekten Namen
- [ ] Download-Link funktioniert
- [ ] Webhook verarbeitet Events (200 OK)

### Important (SOLLTE funktionieren):
- [ ] Welcome Email kommt an (evtl. Spam)
- [ ] Password-Reset funktioniert
- [ ] Login/Logout funktioniert
- [ ] Session Token sicher gespeichert

### Nice-to-Have:
- [ ] E-Mail landet im Posteingang (nicht Spam)
- [ ] Download ohne Login blockiert
- [ ] Duplicate Email handling

---

## 🐛 Gefundene Bugs / Issues:

### Bug 1:
**Beschreibung:**  
**Reproduktion:**  
**Priority:** High / Medium / Low  
**Status:** Open / Fixed  

### Bug 2:
**Beschreibung:**  
**Reproduktion:**  
**Priority:**  
**Status:**  

---

## 📝 Notizen:

- Stripe Test Mode Keys verwendet?
- Webhook Secret korrekt?
- Domain verifiziert (Resend)?
- Database Connection stabil?

---

## 🚀 Next Steps nach Tests:

1. **Wenn alles funktioniert:**
   - [ ] Stripe Live Mode aktivieren
   - [ ] Echte Zahlungen testen (kleine Beträge)
   - [ ] Monitoring aufsetzen

2. **Bei Fehlern:**
   - [ ] Logs in Vercel prüfen: https://vercel.com/your-project/logs
   - [ ] Stripe Logs prüfen: https://dashboard.stripe.com/test/logs
   - [ ] Neon DB Logs prüfen

---

**Test abgeschlossen am:** __________  
**Ergebnis:** ✅ Pass / ❌ Fail  
**Nächste Schritte:** ____________________
