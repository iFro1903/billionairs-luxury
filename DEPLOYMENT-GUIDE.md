# 🚀 BILLIONAIRS Deployment Guide

## Schritt-für-Schritt Anleitung für Vercel

### 1️⃣ Vercel Account erstellen
1. Gehe zu https://vercel.com
2. Registriere dich mit GitHub, GitLab oder Email
3. Bestätige deine Email-Adresse

### 2️⃣ Domain vorbereiten (billionairs.luxury)
1. Gehe zu deinem Domain-Registrar (wo du die Domain gekauft hast)
2. Notiere dir die Nameserver-Einstellungen (brauchst du später)

### 3️⃣ Projekt zu GitHub hochladen
```bash
# Im Projektordner
git init
git add .
git commit -m "Initial commit - BILLIONAIRS Launch Ready"
git branch -M main

# Erstelle ein neues Repository auf GitHub
# Dann:
git remote add origin https://github.com/DEIN-USERNAME/billionairs-luxury.git
git push -u origin main
```

### 4️⃣ Projekt bei Vercel deployen
1. Gehe zu https://vercel.com/new
2. Importiere dein GitHub Repository
3. Vercel erkennt automatisch die Einstellungen

**Build Settings:**
- Framework Preset: Other
- Build Command: (leer lassen)
- Output Directory: (leer lassen)
- Install Command: `npm install`

### 5️⃣ Environment Variables setzen
In Vercel > Project Settings > Environment Variables:

```
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_DEIN_LIVE_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_DEIN_LIVE_KEY
STRIPE_WEBHOOK_SECRET=whsec_DEIN_WEBHOOK_SECRET
DOMAIN=https://billionairs.luxury
```

### 6️⃣ Domain verbinden
1. In Vercel Dashboard > Domains
2. Klicke "Add Domain"
3. Gib ein: `billionairs.luxury`
4. Folge den Anweisungen zur DNS-Konfiguration

**DNS Records bei deinem Domain-Registrar:**
```
A Record:
Name: @
Value: 76.76.21.21

CNAME Record:
Name: www
Value: cname.vercel-dns.com
```

### 7️⃣ Stripe Webhook einrichten
1. Gehe zu https://dashboard.stripe.com/webhooks
2. Klicke "Add endpoint"
3. URL: `https://billionairs.luxury/webhook`
4. Events auswählen:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Kopiere den Webhook Secret und füge ihn zu Vercel Environment Variables hinzu

### 8️⃣ SSL/HTTPS
- Vercel aktiviert automatisch HTTPS
- Deine Seite ist sofort SSL-gesichert ✅

### 9️⃣ Testing nach Deployment
1. Öffne https://billionairs.luxury
2. Teste den kompletten Payment-Flow
3. Überprüfe Stripe Dashboard für Transaktionen

### 🔟 Stripe Live-Modus aktivieren
1. Gehe zu https://dashboard.stripe.com
2. Schalte oben rechts von "Test" auf "Live"
3. Kopiere die Live API Keys
4. Aktualisiere die Environment Variables in Vercel

---

## ⚡ Schnell-Deployment (Alternative ohne GitHub)

### Option: Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 🔒 Pre-Launch Checklist

- [ ] Alle Test-Keys durch Live-Keys ersetzt
- [ ] NODE_ENV=production gesetzt
- [ ] Stripe Webhook konfiguriert
- [ ] Domain DNS korrekt eingerichtet
- [ ] SSL/HTTPS aktiv
- [ ] Erfolgreiche Test-Zahlung durchgeführt
- [ ] Email-Benachrichtigungen getestet
- [ ] 404 Seite funktioniert
- [ ] Mobile-Ansicht geprüft

---

## 📊 Nach dem Launch

### Monitoring
- Vercel Analytics automatisch aktiviert
- Stripe Dashboard für Zahlungen überwachen
- Error-Logs in Vercel > Logs checken

### Updates deployen
```bash
git add .
git commit -m "Update: XYZ"
git push
# Vercel deployed automatisch!
```

---

## 🆘 Support & Troubleshooting

### Häufige Probleme:

**"Stripe API Key ungültig"**
→ Überprüfe Environment Variables in Vercel

**"Webhook nicht erreichbar"**
→ Stelle sicher, dass die URL in Stripe genau `https://billionairs.luxury/webhook` ist

**"Domain nicht erreichbar"**
→ DNS-Änderungen können 24-48h dauern

**"500 Server Error"**
→ Checke Vercel Logs und Environment Variables

---

## 💰 Kosten Übersicht

- **Vercel Hosting**: KOSTENLOS (Hobby Plan)
- **Stripe Gebühren**: 2.9% + 30¢ pro Transaktion
- **Domain**: ~15-50€/Jahr (bereits gekauft)

---

**Bereit für den Launch? Let's go! 🚀**
