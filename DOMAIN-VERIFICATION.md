# Domain-Verifizierung für Resend Email Service

## Status: VORBEREITET (Manuelle DNS-Konfiguration erforderlich)

---

## 📋 Übersicht

Um professionelle Emails von `@billionairs.luxury` zu versenden (statt `@resend.dev`), muss die Domain in Resend verifiziert werden.

---

## 🔧 Schritt-für-Schritt Anleitung

### 1. Resend Dashboard öffnen
- Gehe zu: https://resend.com/domains
- Login mit deinem Account

### 2. Domain hinzufügen
- Klicke auf **"Add Domain"**
- Gib ein: `billionairs.luxury`
- Klicke auf **"Add"**

### 3. DNS-Einträge erhalten
Resend zeigt dir **3 DNS-Einträge**, die du hinzufügen musst:

#### A) SPF Record (TXT)
```
Type: TXT
Name: @ (oder billionairs.luxury)
Value: v=spf1 include:_spf.resend.com ~all
```

#### B) DKIM Record (TXT)
```
Type: TXT
Name: resend._domainkey
Value: [Wird von Resend generiert - einzigartiger Key]
```

#### C) DMARC Record (TXT) - Optional
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@billionairs.luxury
```

---

## 🌐 DNS-Einträge hinzufügen

Du musst diese Einträge bei deinem **Domain-Provider** hinzufügen (wo du billionairs.luxury registriert hast):

### Beliebte Provider:
- **GoDaddy**: DNS Management → Add Record
- **Namecheap**: Advanced DNS → Add New Record
- **Cloudflare**: DNS → Add Record
- **Google Domains**: DNS → Custom Records
- **AWS Route53**: Hosted Zones → Create Record

### Schritte:
1. Login bei deinem Domain-Provider
2. Gehe zu DNS-Einstellungen / DNS-Management
3. Füge alle 3 TXT-Records hinzu
4. Warte 5-60 Minuten (DNS-Propagation)
5. Zurück zu Resend → "Verify Domain"

---

## ✅ Nach der Verifizierung

### 1. Email-Service aktualisieren
In `api/email-service.js` ändern:

```javascript
// VORHER (Test-Modus)
const FROM_EMAIL = 'BILLIONAIRS <onboarding@resend.dev>';

// NACHHER (Produktion)
const FROM_EMAIL = 'BILLIONAIRS <welcome@billionairs.luxury>';
```

### 2. Vorteile
- ✅ Emails an **ALLE** Adressen senden (nicht nur furkan_akaslan@hotmail.com)
- ✅ Professioneller Absender: `welcome@billionairs.luxury`
- ✅ Bessere Zustellbarkeit (kein Spam)
- ✅ Höheres Vertrauen bei Empfängern
- ✅ Keine Test-Modus-Beschränkungen mehr

---

## 🚀 Alternative: Sofort Testen (ohne Domain)

**Aktuelle Lösung (bereits implementiert):**
- Alle Emails werden an `furkan_akaslan@hotmail.com` umgeleitet
- Im Betreff steht: `[TEST for email@example.com] Welcome to BILLIONAIRS...`
- Du siehst trotzdem alle Emails mit korrektem Design
- Perfekt für Testing, bis Domain verifiziert ist

---

## 📊 Status

| Feature | Test-Modus | Nach Domain-Verifizierung |
|---------|-----------|---------------------------|
| Email-Design | ✅ Rose Gold | ✅ Rose Gold |
| Empfänger | ⚠️ Nur furkan_akaslan@hotmail.com | ✅ Alle Adressen |
| Absender | `onboarding@resend.dev` | `welcome@billionairs.luxury` |
| Limit | 3000/Monat | 3000/Monat (Free Tier) |
| Zustellrate | Gut | Ausgezeichnet |

---

## 🔍 Häufige Fragen

**Q: Wie lange dauert DNS-Propagation?**
A: 5-60 Minuten, manchmal bis zu 24 Stunden.

**Q: Muss ich alle 3 Records hinzufügen?**
A: SPF + DKIM sind Pflicht. DMARC ist optional, aber empfohlen.

**Q: Kann ich subdomain benutzen (z.B. mail.billionairs.luxury)?**
A: Ja, aber dann musst du das in Resend entsprechend konfigurieren.

**Q: Was kostet das?**
A: Resend ist bis 3000 Emails/Monat kostenlos.

**Q: Wie kann ich testen, ob DNS funktioniert?**
A: Benutze https://mxtoolbox.com/SuperTool.aspx → SPF Lookup

---

## 📞 Support

Bei Problemen:
1. Resend Docs: https://resend.com/docs/dashboard/domains/introduction
2. DNS-Test: https://mxtoolbox.com/
3. Resend Support: support@resend.com

---

**Erstellt:** 1. November 2025  
**Für:** BILLIONAIRS Luxury Platform  
**Status:** Bereit zur Implementierung
