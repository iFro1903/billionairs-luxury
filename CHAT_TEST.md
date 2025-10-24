# Chat System Test Anleitung

## 1. Datenbank vorbereiten (Neon Console)

```sql
-- Test-User auf Chat bereit setzen (169 Stunden = 7+ Tage)
UPDATE users
SET eye_opened_at = NOW() - INTERVAL '169 hours',
    chat_ready = TRUE
WHERE email = 'DEINE_EMAIL@HIER.COM';

-- Prüfen
SELECT email, chat_ready, eye_opened_at, chat_opened_at
FROM users
WHERE email = 'DEINE_EMAIL@HIER.COM';
```

## 2. Chat testen

1. **Auf the-hidden-door.html gehen**
2. **Das Auge klicken** → Chat sollte sich öffnen
3. **Überprüfen:**
   - ✅ Chat Overlay erscheint mit Backdrop Blur
   - ✅ "THE INNER CIRCLE" Header mit Rose Gold
   - ✅ "Titan #XXXX" Username wird generiert
   - ✅ Empty State: "Welcome, Titan #XXXX"
   - ✅ Online Count zeigt "1 Online"
   - ✅ Input Field funktioniert
   - ✅ Send Button (➤) reagiert auf Hover

4. **Nachricht senden:**
   - Text eingeben
   - Enter drücken oder Send Button klicken
   - Nachricht sollte als "eigene" Message erscheinen (rose gold bubble rechts)

5. **Zweiten Browser/Inkognito öffnen:**
   - Mit anderem Test-User einloggen
   - Auch auf 169h + chat_ready setzen
   - Nachricht senden
   - Sollte bei beiden Usern erscheinen (anderer = grauer bubble links)
   - Online Count sollte "2 Online" zeigen

## 3. Features die funktionieren sollten:

### Design:
- ✅ Glassmorphism Container
- ✅ Backdrop Blur (10px)
- ✅ Rose Gold Akzente (#E8C4A8)
- ✅ Cinzel Font im Header
- ✅ Smooth Slide-in Animation
- ✅ Custom Rose Gold Scrollbar
- ✅ Pulse Animation bei Online Dot

### Funktionalität:
- ✅ Real-time Polling (alle 3 Sekunden)
- ✅ Titan #XXXX anonyme Usernames
- ✅ Message Bubbles (eigene/andere)
- ✅ Timestamps (HH:MM Format)
- ✅ Auto-Scroll zu neuen Messages
- ✅ Online User Count
- ✅ HTML-Escaping (Sicherheit)
- ✅ Enter-Taste zum Senden
- ✅ 500 Zeichen Limit
- ✅ Close Button (×)

### API:
- ✅ GET /api/chat?email=xxx → Messages laden
- ✅ POST /api/chat → Message senden
- ✅ Online Count (aktiv < 5 Min)
- ✅ Last 100 Messages
- ✅ Zugriffskontrolle (chat_ready Check)

## 4. Wenn Chat nicht erscheint:

**Browser Console öffnen (F12) und prüfen:**

```javascript
// 1. Easter Egg Status prüfen
fetch('/api/easter-egg', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: localStorage.getItem('userEmail'),
        action: 'check_status'
    })
}).then(r => r.json()).then(console.log);

// Sollte zeigen:
// chatReady: true
// chatUnlocked: false (wird true nach erstem Click)

// 2. Chat manuell öffnen
luxuryChat = new LuxuryChat();
luxuryChat.init(localStorage.getItem('userEmail'));
luxuryChat.open();
```

## 5. Locked-State testen:

```sql
-- User auf < 7 Tage setzen
UPDATE users
SET eye_opened_at = NOW() - INTERVAL '50 hours',
    chat_ready = FALSE
WHERE email = 'DEINE_EMAIL@HIER.COM';
```

Auge klicken → Sollte zeigen:
- 🔒 Icon
- "Locked"
- "The eye sees, but does not yet speak. Return when seven suns have set."

## 6. Deployment Check:

- ✅ Git Commit: `dc2bee3` - "Feature: Premium Luxury Chat System"
- ✅ Vercel Deployment: Automatisch
- ✅ Dateien deployed:
  - `api/chat.js` ✅
  - `assets/css/chat.css` ✅
  - `assets/js/chat.js` ✅
  - `the-hidden-door.html` ✅ (mit chat.css + chat.js)
  - `assets/js/easter-egg.js` ✅ (mit showChat() Integration)

## 7. SQL zum Zurücksetzen:

```sql
-- Chat Status zurücksetzen
UPDATE users
SET chat_opened_at = NULL,
    chat_ready = FALSE
WHERE email = 'DEINE_EMAIL@HIER.COM';

-- Alle Test-Nachrichten löschen
DELETE FROM chat_messages
WHERE email IN ('TEST_EMAIL_1', 'TEST_EMAIL_2');
```

---

**🎉 Wenn alles funktioniert, ist das Chat System komplett!**
