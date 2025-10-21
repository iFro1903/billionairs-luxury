# 📧 E-Mail Setup für Wire Transfer

## Was wurde implementiert?

Die Wire Transfer Funktion sendet jetzt **automatisch eine E-Mail** an den Kunden mit allen Bankdaten.

## Setup Schritte

### 1. Resend Account erstellen (KOSTENLOS)

1. Gehe zu: https://resend.com
2. Klicke auf "Sign Up"
3. Erstelle einen kostenlosen Account
4. **Kostenlos:** 100 E-Mails/Tag, 3000 E-Mails/Monat

### 2. API Key generieren

1. Gehe zu: https://resend.com/api-keys
2. Klicke "Create API Key"
3. Name: `Billionairs Luxury`
4. Kopiere den API Key (beginnt mit `re_`)

### 3. Domain verifizieren (Optional aber empfohlen)

**Ohne Domain (für Testing):**
- E-Mails werden von `onboarding@resend.dev` gesendet
- Funktioniert sofort, aber sieht nicht professionell aus

**Mit eigener Domain (für Production):**
1. Gehe zu: https://resend.com/domains
2. Füge deine Domain hinzu: `billionairs-luxury.com`
3. Folge den DNS-Anweisungen (SPF, DKIM, DMARC Records)
4. Warte auf Verifizierung (5-30 Minuten)
5. Ändere in `api/wire-transfer.js`:
   ```javascript
   from: 'BILLIONAIRS LUXURY <payments@billionairs-luxury.com>'
   ```

### 4. Environment Variable in Vercel setzen

1. Gehe zu: https://vercel.com/ifro1903/billionairs-luxury/settings/environment-variables
2. Füge hinzu:
   - **Key:** `RESEND_API_KEY`
   - **Value:** `re_dein_api_key_hier`
   - **Environment:** Production, Preview, Development (alle 3 auswählen)
3. Klicke "Save"

### 5. Vercel neu deployen

Nach dem Hinzufügen der Environment Variable:
```bash
git add -A
git commit -m "Add email functionality for wire transfers"
git push origin main
```

Vercel wird automatisch neu deployen und die E-Mail-Funktion ist aktiv!

## Was passiert jetzt?

✅ Kunde füllt Wire Transfer Formular aus
✅ API validiert die Daten
✅ **E-Mail wird automatisch gesendet** mit:
   - Bankname: UBS Switzerland AG
   - Account Holder: Furkan Akaslan
   - IBAN: CH13 0022 7227 1418 9140 B
   - SWIFT: UBSWCHZH80A
   - Unique Reference Number
   - Anweisungen und nächste Schritte
✅ Modal zeigt Bankdaten an
✅ Kunde erhält E-Mail zur Bestätigung

## E-Mail Vorlage

Die E-Mail ist im BILLIONAIRS LUXURY Design:
- 🎨 Gold (#D4AF37) und Schwarz Theme
- 📋 Alle Bankdaten übersichtlich
- ⚠️ Wichtige Anweisungen hervorgehoben
- 🔢 Reference Number prominent angezeigt
- 📧 Professionelles HTML-Design

## Kosten

**Resend Free Tier:**
- ✅ 100 E-Mails pro Tag
- ✅ 3,000 E-Mails pro Monat
- ✅ Völlig kostenlos
- ✅ Kreditkarte nicht erforderlich

**Für mehr:**
- $20/Monat = 50,000 E-Mails

## Testing

**Ohne API Key:**
- Funktion läuft trotzdem
- `emailSent: false` in Response
- Modal zeigt Bankdaten an

**Mit API Key:**
- E-Mail wird gesendet
- `emailSent: true` in Response
- Kunde erhält E-Mail + Modal

## Support

Bei Fragen: support@billionairs-luxury.com
