# 🔺👁️ Easter Egg System - Documentation

## Overview
Das Easter Egg System ist ein mehrstufiges Belohnungssystem für zahlende Mitglieder.

## Timeline

### Phase 1: Pyramide erscheint (20 Sekunden nach erstem Login)
- **Trigger**: 20 Sekunden nach dem ersten Dashboard-Zugriff nach erfolgreicher Zahlung
- **Erscheinung**: Goldene, schwebende Pyramide oben rechts
- **Aktion**: Nutzer klickt auf Pyramide
- **Rätsel**: 
  ```
  The triangle has three sides.
  Each side demands your presence.
  Return when the sun rises. Three times.
  ```
- **Hinweis**: User muss 3 Tage hintereinander einloggen

### Phase 2: 72-Stunden Challenge
- **Anforderung**: 3 aufeinanderfolgende Tage einloggen
- **Tracking**: `login_streak` in Datenbank
- **Fortschritt**: Login Streak Badge oben rechts (zeigt aktuelle Streak)
- **Bei Unterbrechung**: Streak wird zurückgesetzt auf 1

### Phase 3: Pyramide → Auge Transformation
- **Trigger**: Nach genau 72 Stunden UND 3 erfolgreichen Logins
- **Transformation**: Pyramide verwandelt sich in allsehendes Auge 👁️
- **Aktion**: User klickt auf Auge
- **Rätsel**:
  ```
  The number of divine perfection.
  Days of creation. Wonders of the world.
  Count them. Return for each.
  ```
- **Hinweis**: 7 Tage warten

### Phase 4: Chat Freischaltung
- **Trigger**: Nach genau 168 Stunden (7 Tage) ab `eye_opened_at`
- **Freischaltung**: Anonymer Chat zwischen allen Usern
- **Status**: Aktuell nur Placeholder ("Coming soon...")
- **Zukünftig**: WebSocket-basierter anonymer Chat

## Datenbank-Felder

```sql
first_dashboard_access   TIMESTAMP    -- Erster Zugriff nach Payment
pyramid_unlocked         BOOLEAN      -- Pyramide wurde geöffnet
pyramid_opened_at        TIMESTAMP    -- Zeitpunkt der Pyramiden-Öffnung
eye_unlocked             BOOLEAN      -- Auge wurde freigeschaltet
eye_opened_at            TIMESTAMP    -- Zeitpunkt der Augen-Öffnung
chat_unlocked            BOOLEAN      -- Chat wurde freigeschaltet
last_daily_login         TIMESTAMP    -- Letzter täglicher Login
login_streak             INTEGER      -- Aufeinanderfolgende Login-Tage
```

## API Endpoints

### POST /api/easter-egg

**Actions:**

1. **check_status**
   - Gibt aktuellen Status zurück
   - Berechnet ob Pyramide/Auge/Chat ready sind
   - Prüft Zeitbedingungen

2. **first_access**
   - Setzt `first_dashboard_access` Timestamp
   - Nur beim allerersten Zugriff

3. **open_pyramid**
   - Markiert Pyramide als geöffnet
   - Gibt Rätsel-Text zurück
   - Setzt `pyramid_opened_at`

4. **daily_login**
   - Trackt täglichen Login
   - Updated `login_streak`
   - Logik: 
     - Gleicher Tag = Streak bleibt
     - Nächster Tag = Streak +1
     - Lücke > 1 Tag = Streak zurück auf 1

5. **unlock_eye**
   - Schaltet Auge frei (nach 72h + 3 Logins)
   - Gibt zweites Rätsel zurück
   - Setzt `eye_opened_at`

6. **unlock_chat**
   - Schaltet Chat frei (nach 168h)
   - Setzt `chat_unlocked = TRUE`

## Frontend Implementation

### Dateien:
- `/assets/css/easter-egg.css` - Styling für Pyramide, Auge, Modal
- `/assets/js/easter-egg.js` - JavaScript Logik
- `dashboard.html` - Integriert CSS & JS

### Key Functions:

```javascript
EasterEggSystem.init(email)           // Initialisierung
EasterEggSystem.checkStatus()         // Status prüfen
EasterEggSystem.showPyramid()         // Pyramide anzeigen
EasterEggSystem.transformPyramidToEye() // Transformation
EasterEggSystem.showRiddle()          // Rätsel-Modal
EasterEggSystem.showChat()            // Chat-Interface
```

## Setup Instructions

### 1. Datenbank Migration
```bash
psql $DATABASE_URL -f database/add-easter-egg-fields.sql
```

### 2. Deployment
Alle Dateien sind bereits erstellt:
- ✅ `api/easter-egg.js`
- ✅ `assets/css/easter-egg.css`
- ✅ `assets/js/easter-egg.js`
- ✅ `dashboard.html` (updated)

### 3. Testing Flow

**Als neuer bezahlter User:**
1. Login → Dashboard
2. Warte 20 Sekunden → Pyramide erscheint
3. Klick auf Pyramide → Rätsel lesen
4. Logout + Login an Tag 2 → Streak = 2
5. Logout + Login an Tag 3 → Streak = 3
6. Nach 72h exakt → Pyramide wird zu Auge
7. Klick auf Auge → Zweites Rätsel
8. Nach weiteren 168h → Chat freigeschaltet

## Monitoring

### Login Streak Badge
- Zeigt aktuelle Streak an
- Position: Oben rechts unter Logout
- Verschwindet wenn Streak = 0

### Status Checks
- Automatisch jede Minute
- Prüft ob Transformationen fällig sind
- Updated UI dynamisch

## Future Enhancements

### Chat System (Phase 4)
- WebSocket Server (Socket.io oder Pusher)
- Anonyme Usernames (z.B. "Titan #1234")
- Message Persistence
- Online Status
- Rich Text / Emojis
- Moderations-Tools

### Possible Extensions
- Mehr Rätsel-Stufen
- Achievements System
- Easter Egg Counter
- Leaderboard (wer hat als erstes alle freigeschaltet)
- Spezielle Badges für frühe Entdecker

## Security Considerations

- ✅ Alle Zeitchecks server-side
- ✅ User kann Client nicht manipulieren
- ✅ Timestamps in DB unveränderlich
- ✅ Streak-Reset bei Manipulation
- ⚠️ Chat braucht Content Moderation
- ⚠️ Rate Limiting für API Calls

## Support

Bei Problemen:
1. Check Browser Console für Fehler
2. Verifiziere DB Felder existieren
3. Prüfe API Response in Network Tab
4. Check Timestamps in DB direkt

---

**Status**: ✅ Implementiert, Ready for Testing
**Nächster Schritt**: Database Migration durchführen
