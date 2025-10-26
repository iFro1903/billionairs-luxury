# 🚀 UPSTASH REDIS SETUP

## Was ist Upstash Redis?
- **Schnelle In-Memory Datenbank** für Rate Limiting
- **Serverless-kompatibel** - funktioniert über alle Vercel Instances
- **Kostenlos** bis 10.000 Requests/Tag

## Warum brauchen wir das?
Ohne Redis kann jemand unbegrenzt Login-Versuche machen, weil Vercel Serverless Functions keinen gemeinsamen Speicher haben.

---

## 📋 SETUP SCHRITTE

### 1. Upstash Account erstellen
1. Gehe zu: https://console.upstash.com/
2. Klicke **"Sign Up"** (kostenlos mit GitHub/Google)
3. Bestätige Email

### 2. Redis Database erstellen
1. Klicke **"Create Database"**
2. Einstellungen:
   - **Name:** billionairs-redis
   - **Type:** Regional (kostenlos)
   - **Region:** Europe (eu-west-1) - nah zu Neon Database
   - **Eviction:** No eviction
3. Klicke **"Create"**

### 3. Connection Details kopieren
Nach der Erstellung siehst du:
```
UPSTASH_REDIS_REST_URL: https://eu2-xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN: AaBbCc...xxxxxx
```

**WICHTIG:** Kopiere beide Werte!

### 4. Vercel Environment Variables hinzufügen
1. Öffne: https://vercel.com/ifro1903/billionairs-luxury/settings/environment-variables
2. Klicke **"Add New"** (2x für beide Variablen)

**Variable 1:**
```
Name:  UPSTASH_REDIS_REST_URL
Value: <dein-upstash-url>
Environments: ✅ Production ✅ Preview ✅ Development
```

**Variable 2:**
```
Name:  UPSTASH_REDIS_REST_TOKEN
Value: <dein-upstash-token>
Environments: ✅ Production ✅ Preview ✅ Development
```

3. Klicke **"Save"** für beide

### 5. Redeploy triggern
1. Gehe zu **"Deployments"** Tab
2. Klicke beim letzten Deployment auf **"..."** → **"Redeploy"**
3. Warte ~30 Sekunden

### 6. Testen
1. Gehe zu Admin Login: https://billionairs-luxury.vercel.app/admin.html
2. Gib 6x falsches Passwort ein
3. Beim 6. Versuch sollte kommen: **"Rate limit exceeded"** ✅

---

## ✅ FERTIG!

**Was jetzt funktioniert:**
- ⚡ Rate Limiting über alle Vercel Server
- 🔒 Schutz vor Brute-Force Attacken
- 🚀 10x schneller als PostgreSQL für Counter

**Fallback:** Falls Redis nicht konfiguriert, nutzt das System automatisch PostgreSQL (langsamer aber funktioniert).

---

## 📊 Upstash Dashboard

Im Upstash Dashboard kannst du sehen:
- **Commands:** Anzahl Redis-Befehle
- **Storage:** Speichernutzung
- **Latency:** Antwortzeit

Free Tier: 10.000 Requests/Tag (mehr als genug für deine App)
