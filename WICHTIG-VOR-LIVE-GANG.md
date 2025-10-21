# ⚠️ WICHTIG: VOR LIVE-GANG ERLEDIGEN

## 🔐 CRYPTO WALLETS EINRICHTEN (KRITISCH!)

### Aktueller Status: ❌ DEMO-ADRESSEN AKTIV
**⚠️ COINS GEHEN AKTUELL AN FREMDE ADRESSEN!**

### Was du SOFORT machen musst:

---

## 1️⃣ BITCOIN (BTC) WALLET

### Empfohlene Wallets:
- **Trust Wallet** (Mobile & Desktop) - Einfach
- **Exodus** (Desktop) - Benutzerfreundlich
- **Coinbase** (Web & Mobile) - Anfängerfreundlich
- **Ledger/Trezor** (Hardware) - Maximum Sicherheit

### Schritte:
1. Wallet-App herunterladen und installieren
2. Neue Bitcoin-Wallet erstellen
3. **SEED PHRASE SICHER AUFBEWAHREN** (Papier, Safe!)
4. Bitcoin Receiving Address kopieren
5. Format: `1A1zP1...` oder `bc1q...` (beginnt mit 1, 3 oder bc1)

### ✅ Deine BTC-Adresse:
```
Hier einfügen: _______________________________________
```

---

## 2️⃣ ETHEREUM (ETH) WALLET

### Empfohlene Wallets:
- **MetaMask** (Browser Extension) - Am beliebtesten
- **Trust Wallet** (Mobile & Desktop)
- **Coinbase** (Web & Mobile)
- **Ledger/Trezor** (Hardware)

### Schritte:
1. MetaMask Extension installieren (Chrome/Firefox)
2. Neue Wallet erstellen
3. **SEED PHRASE SICHER AUFBEWAHREN!**
4. Ethereum Address kopieren
5. Format: `0x742d...` (beginnt immer mit 0x, 42 Zeichen)

### ✅ Deine ETH-Adresse:
```
Hier einfügen: _______________________________________
```

---

## 3️⃣ TETHER (USDT) WALLET

### WICHTIG:
- **USDT nutzt DIESELBE Adresse wie Ethereum!**
- Du brauchst nur 1 Ethereum-Wallet für BEIDE (ETH & USDT)
- Stelle sicher, dass deine Wallet **ERC-20 Tokens** unterstützt

### ✅ Deine USDT-Adresse:
```
Gleich wie Ethereum: 0x... (siehe oben)
```

---

## 📝 CODE-ÄNDERUNG VORNEHMEN

### Datei: `api/crypto-payment.js` (Zeilen 95-122)

**Aktuell (DEMO):**
```javascript
bitcoin: {
    address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',  // ❌ SATOSHI'S ADRESSE!
ethereum: {
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',  // ❌ ZUFÄLLIGE ADRESSE!
usdt: {
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',  // ❌ ZUFÄLLIGE ADRESSE!
```

**Ersetzen mit DEINEN Adressen:**
```javascript
bitcoin: {
    address: 'DEINE_BTC_ADRESSE_HIER',
ethereum: {
    address: 'DEINE_ETH_ADRESSE_HIER',
usdt: {
    address: 'DEINE_ETH_ADRESSE_HIER',  // Gleich wie ETH!
```

---

## 🔒 SICHERHEITS-CHECKLISTE

### ✅ Was du TUN sollst:
- [ ] Wallet-Apps von **offiziellen Quellen** herunterladen
- [ ] **Seed Phrase** auf Papier schreiben (NICHT digital!)
- [ ] Seed Phrase an **2 sicheren Orten** aufbewahren (z.B. Safe, Bankschließfach)
- [ ] Receiving Addresses kopieren und testen
- [ ] Test-Transaktion mit kleinem Betrag durchführen

### ❌ Was du NIEMALS tun sollst:
- ❌ Seed Phrase/Private Key digital speichern (kein Screenshot, kein Cloud!)
- ❌ Seed Phrase/Private Key mit IRGENDWEM teilen (auch nicht mit mir!)
- ❌ Seed Phrase/Private Key per Email/WhatsApp senden
- ❌ Auf Phishing-Links klicken
- ❌ Wallets von unbekannten Quellen installieren

---

## 💰 CRYPTO RATES (AKTUALISIEREN!)

### Datei: `api/crypto-payment.js` (Zeile ~130)

**Aktuell:**
```javascript
const cryptoRates = {
    bitcoin: 'CHF 500\'000.00 ÷ ~CHF 85\'000 ≈ 5.88 BTC',
    ethereum: 'CHF 500\'000.00 ÷ ~CHF 3\'400 ≈ 147.06 ETH',
    usdt: 'CHF 500\'000.00 ÷ ~CHF 1.00 ≈ 500\'000 USDT'
};
```

**Diese Rates REGELMÄSSIG aktualisieren** (Crypto-Preise ändern sich ständig!)

### Wo aktuelle Preise finden:
- CoinGecko: https://www.coingecko.com/
- CoinMarketCap: https://coinmarketcap.com/
- Kraken: https://www.kraken.com/prices

---

## 📧 EMAIL SETUP (BEREITS KONFIGURIERT)

### ✅ Resend API:
- API Key: `re_j5kRtc9r_HepScsuuif729ZzkijSC4kE6`
- Sender: `onboarding@resend.dev`
- Status: **Funktioniert!** (Bitcoin & Ethereum getestet)

### Optional - Eigene Domain:
Falls du später von deiner eigenen Domain senden willst:
1. Domain in Resend hinzufügen
2. DNS-Einträge konfigurieren
3. Sender in `api/crypto-payment.js` ändern

---

## 🧪 TESTING VOR LIVE-GANG

### Test-Checkliste:
- [ ] Bitcoin-Zahlung mit echten Daten testen
- [ ] Ethereum-Zahlung mit echten Daten testen
- [ ] USDT-Zahlung mit echten Daten testen
- [ ] Email-Empfang bestätigen
- [ ] QR-Codes scannen und prüfen
- [ ] Wallet-Adressen in Blockchain-Explorer prüfen
- [ ] Mobile Ansicht testen
- [ ] Verschiedene Browser testen

### Blockchain Explorer:
- Bitcoin: https://blockchain.com/explorer
- Ethereum: https://etherscan.io/
- Tether: https://etherscan.io/ (ERC-20)

---

## 📊 MONITORING NACH LIVE-GANG

### Was du überwachen solltest:
1. **Vercel Logs** - Fehler in den API-Calls
2. **Email Delivery** - Resend Dashboard
3. **Wallet Balance** - Eingehende Transaktionen
4. **Customer Support** - Fragen zu Zahlungen

### Vercel Dashboard:
- https://vercel.com/ifro1903/billionairs-luxury
- Deployment Logs
- Function Logs
- Analytics

### Resend Dashboard:
- https://resend.com/emails
- Email Delivery Status
- Bounce/Spam Reports

---

## 🚀 LIVE-GANG PROZESS

### Schritt-für-Schritt:

1. **Wallets einrichten** (siehe oben)
2. **Adressen in Code einfügen** (`api/crypto-payment.js`)
3. **Git Commit & Push**
   ```bash
   git add api/crypto-payment.js
   git commit -m "Update: Replace demo crypto addresses with production wallets"
   git push
   ```
4. **Vercel Auto-Deploy abwarten** (~1-2 Minuten)
5. **Test-Zahlung durchführen** (mit echtem Kunden oder Freund)
6. **Transaktion in Wallet prüfen**
7. **✅ LIVE!**

---

## 📱 KONTAKT & SUPPORT

### Bei Problemen:
- Vercel Support: https://vercel.com/support
- Resend Support: https://resend.com/support
- Crypto Wallet Support: (Je nach gewählter Wallet)

### Wichtige Links:
- Website: https://billionairs-luxury.vercel.app
- GitHub Repo: https://github.com/iFro1903/billionairs-luxury
- Vercel Dashboard: https://vercel.com/ifro1903

---

## 💡 ZUSÄTZLICHE EMPFEHLUNGEN

### Für mehr Sicherheit:
1. **Hardware Wallet** für große Beträge (Ledger/Trezor)
2. **Multi-Sig Wallet** für zusätzlichen Schutz
3. **Regelmäßige Backups** der Wallet-Daten
4. **2FA aktivieren** auf allen Accounts (Vercel, GitHub, Resend)

### Für bessere User Experience:
1. **Admin Dashboard** bauen (Transaktionen überwachen)
2. **Blockchain Explorer Integration** (Transaktionen verifizieren)
3. **Automatische Bestätigungs-Email** nach Zahlungseingang
4. **Live Crypto Rates** API integrieren (CoinGecko/CryptoCompare)

---

## ⏰ ZEITPLAN

### Empfohlen:
- **Wallets einrichten:** 30-60 Minuten
- **Test-Transaktionen:** 1-2 Stunden (Blockchain-Bestätigungen abwarten)
- **Code anpassen & deployen:** 10 Minuten
- **Final Testing:** 30 Minuten

### Gesamt: ~2-4 Stunden bis komplett live

---

# 🎯 ZUSAMMENFASSUNG

## Status JETZT:
- ✅ Website funktioniert
- ✅ Email-System funktioniert
- ✅ UI/UX fertig
- ❌ **DEMO WALLET-ADRESSEN** (Coins gehen verloren!)

## Status nach Wallet-Einrichtung:
- ✅ Website funktioniert
- ✅ Email-System funktioniert
- ✅ UI/UX fertig
- ✅ **ECHTE WALLET-ADRESSEN** (Coins kommen bei dir an!)

---

**DIESE DATEI LÖSCHEN WENN FERTIG!**

Erstellt am: 21. Oktober 2025
Letzte Aktualisierung: Vor Live-Gang

---

