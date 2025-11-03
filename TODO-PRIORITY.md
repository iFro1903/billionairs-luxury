# 🔴 PRIORITY TODO - BILLIONAIRS.LUXURY

## Datum: 3. November 2025

---

## ❌ KRITISCHE PROBLEME (MUSS GEFIXT WERDEN)

### 1. Hamburger Menu (Mobile) funktioniert nicht
**Problem:**
- Wenn man auf Hamburger-Icon (☰) klickt, blockiert es den Scroll
- Die 3 Buttons (INNER CIRCLE, LANGUAGE, CONTACT) werden NICHT angezeigt
- Startseite bleibt sichtbar aber man kann nichts machen
- Muss neu gestartet werden um weiterzuarbeiten

**Betroffene Dateien:**
- `assets/css/mobile-nav.css` - CSS für Mobile Menu Overlay
- `assets/js/main.js` - JavaScript Hamburger Menu Event Listeners
- `index.html` - HTML Structure (Line 239: mobile-menu-overlay)

**Technische Details:**
- `display: flex` + `pointer-events: none/auto` wird verwendet
- `z-index: 10000` auf Overlay
- `body.style.overflow = 'hidden'` blockiert Scroll
- Problem: Buttons werden nicht gerendert oder sind unsichtbar

**Lösungsansätze zum Testen:**
- [ ] Check ob `.mobile-menu-content` und `.mobile-menu-item` richtig gerendert werden
- [ ] Z-index Konflikte prüfen
- [ ] Opacity/Visibility Animation checken
- [ ] Console Logs hinzufügen um zu sehen ob Events gefeuert werden
- [ ] Testen ob Buttons existieren aber unsichtbar sind (Inspect Element)

---

### 2. Trust & Value Section - Übersetzungen fehlen
**Problem:**
- Die neue Section "Some experiences can't be explained. They can only be lived." ist nur auf Englisch
- Wenn User auf Deutsch/Französisch/etc wechselt, bleibt dieser Text Englisch
- Muss in alle 9 Sprachen übersetzt werden

**Betroffene Dateien:**
- `index.html` - Trust & Value Section HTML (Lines 333-424)
- `translations/de.json` - Deutsche Übersetzungen
- `translations/fr.json` - Französische Übersetzungen
- `translations/es.json` - Spanische Übersetzungen
- `translations/zh.json` - Chinesische Übersetzungen
- `translations/ar.json` - Arabische Übersetzungen
- `translations/it.json` - Italienische Übersetzungen
- `translations/ru.json` - Russische Übersetzungen
- `translations/ja.json` - Japanische Übersetzungen
- `translations/en.json` - Englische Keys als Referenz

**Texte die übersetzt werden müssen:**
1. Haupttitel: "Some experiences can't be explained. They can only be lived."
2. Untertitel: "Where wealth is the entry requirement. Not the achievement."
3. **4 Benefit Cards:**
   - "Global Access" → Quarterly gatherings in Monaco, Dubai, Zürich
   - "Private Circle" → 47 verified UHNWI worldwide
   - "Pre-Market" → Opportunities before they're public
   - "Discretion" → What happens here, stays here
4. Social Proof: "Trusted by members across 12 countries"
5. **Member Grid:**
   - F.K. - Tech Exit - SF
   - A.M. - Family Office - ZH
   - Anon - Crypto OG - Dubai
   - M.R. - Real Estate - London
   - S.L. - Private Equity - NYC
   - + 42 others
6. Reality Check: "Let's be clear:"
7. **4 Bullet Points:**
   - No trial period
   - No payment plans
   - No refunds
   - Serious investors only
8. Button: "PROCEED TO ACCESS"
9. Rejection Text: "If you're not ready, this isn't for you."

**JSON Structure Format:**
```json
{
  "trustSection": {
    "title": "Some experiences can't be explained. They can only be lived.",
    "subtitle": "Where wealth is the entry requirement. Not the achievement.",
    "benefits": {
      "globalAccess": {
        "title": "Global Access",
        "description": "Quarterly gatherings in Monaco, Dubai, Zürich"
      },
      "privateCircle": {
        "title": "Private Circle",
        "description": "47 verified UHNWI worldwide"
      },
      "preMarket": {
        "title": "Pre-Market",
        "description": "Opportunities before they're public"
      },
      "discretion": {
        "title": "Discretion",
        "description": "What happens here, stays here"
      }
    },
    "socialProof": {
      "title": "Trusted by members across 12 countries",
      "members": {
        "fk": "Tech Exit - SF",
        "am": "Family Office - ZH",
        "anon": "Crypto OG - Dubai",
        "mr": "Real Estate - London",
        "sl": "Private Equity - NYC",
        "others": "+ 42 others"
      }
    },
    "realityCheck": {
      "title": "Let's be clear:",
      "points": [
        "No trial period",
        "No payment plans",
        "No refunds",
        "Serious investors only"
      ]
    },
    "cta": {
      "button": "PROCEED TO ACCESS",
      "rejection": "If you're not ready, this isn't for you."
    }
  }
}
```

---

## ✅ FUNKTIONIERT (NICHT ANFASSEN)

- ✅ Trust & Value Section Integration (HTML/CSS/JS)
- ✅ Desktop Navigation versteckt auf Mobile
- ✅ Transparente Navigation (schwarzer Balken entfernt)
- ✅ Globus 🌐 Emoji im Mobile Menu LANGUAGE Button
- ✅ Mobile-nav.css erstellt und committed
- ✅ Payment System (Bitcoin/Wire/Stripe Test Mode)
- ✅ Multi-Language System (9 Sprachen - nur Trust Section fehlt)
- ✅ Domain billionairs.luxury LIVE

---

## 📋 NÄCHSTE SCHRITTE

1. **ZUERST:** Hamburger Menu Mobile fixen (kritisch - blockiert Mobile UX komplett)
2. **DANN:** Trust Section Übersetzungen hinzufügen (alle 9 JSON Dateien)
3. **DANACH:** Testen auf echtem Mobile Device
4. **FINAL:** Stripe Live Keys aktivieren (sobald Account verifiziert)

---

## 💡 NOTIZEN

- User testet auf echtem iPhone - kein Desktop Simulator
- F12 Console nicht verfügbar auf Mobile → Desktop mit STRG+SHIFT+M nutzen für Debugging
- Vercel Auto-Deploy funktioniert (1-2 Minuten nach Git Push)
- Alle Backups existieren: `*.backup-20251102-*`
- Git Reset zu `6bf4abd` funktioniert (Punkt vor Hamburger/Swiss Secured Problemen)

---

**WICHTIG:** Nicht mehr am CSS/JS rumfummeln bis Hamburger Menu gefixt ist - sonst wird es nur schlimmer!
