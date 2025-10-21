# 🚀 GO-LIVE CHECKLIST - BILLIONAIRS WEBSITE

**Datum:** 20. Oktober 2025  
**Status:** PRE-LAUNCH - Alle Schritte vor Live-Schaltung  
**Priorität:** 🔥 KRITISCH

---

## ✅ PHASE 1: DOMAIN & HOSTING (Tag 1-2)

### 1.1 Domain kaufen
- [ ] Domain registrieren: `billionairs.luxury` (oder Alternative)
  - **Empfohlene Provider:**
    - ✅ Namecheap: https://www.namecheap.com/
    - ✅ GoDaddy: https://www.godaddy.com/
    - ✅ CloudFlare Registrar: https://www.cloudflare.com/products/registrar/
  
- [ ] **WHOIS Privacy Protection aktivieren**
  - Wichtig für Anonymität!
  - Versteckt persönliche Daten in Domain-Whois

- [ ] **Domain-Nameservers konfigurieren**
  - Bei Cloudflare: Nameservers ändern
  - Bei Hosting-Provider: DNS-Einträge setzen

### 1.2 Hosting Provider auswählen
**Mindestanforderungen:**
- ✅ SSL-Zertifikat (Let's Encrypt oder besser)
- ✅ Apache oder Nginx Server
- ✅ .htaccess Support (Apache) oder nginx.conf Zugriff
- ✅ Custom Error Pages Support
- ✅ FTP/SFTP Zugang
- ✅ 99.9% Uptime Garantie

**Empfohlene Hosting-Optionen:**

| Provider | Typ | Preis/Monat | Vorteil |
|----------|-----|-------------|---------|
| **SiteGround** | Shared/VPS | $3-$80 | Exzellenter Support, Auto-SSL |
| **DigitalOcean** | VPS/Cloud | $6-$100 | Volle Kontrolle, Nginx |
| **Cloudflare Pages** | Static | Kostenlos | CDN inklusive, superschnell |
| **Vercel** | Static/Serverless | Kostenlos | Auto-Deploy, SSL inklusive |
| **AWS S3 + CloudFront** | Cloud | $1-$50 | Enterprise-Level, skalierbar |

### 1.3 Server-Typ identifizieren
- [ ] **Terminal-Befehl ausführen:**
  ```bash
  # Apache prüfen
  apache2 -v
  # oder
  httpd -v
  
  # Nginx prüfen
  nginx -v
  ```

- [ ] **Ergebnis notieren:**
  - [ ] Apache → .htaccess verwenden
  - [ ] Nginx → nginx.conf bearbeiten

---

## ✅ PHASE 2: SSL & HTTPS (Tag 2)

### 2.1 SSL-Zertifikat installieren
- [ ] **Option A: Let's Encrypt (Empfohlen - Kostenlos)**
  ```bash
  sudo certbot --apache  # für Apache
  sudo certbot --nginx   # für Nginx
  ```

- [ ] **Option B: Cloudflare SSL (Kostenlos + CDN)**
  - Website zu Cloudflare hinzufügen
  - SSL/TLS Mode: "Full (strict)"
  - Edge Certificates aktivieren

- [ ] **Option C: Hosting-Provider SSL**
  - Control Panel → SSL aktivieren
  - Auto-Renewal prüfen

### 2.2 HTTPS erzwingen
- [ ] **Apache: .htaccess erstellen**
  ```apache
  # Kopiere aus DEPLOYMENT-SECURITY.txt
  # HTTPS Redirect + Security Headers
  ```

- [ ] **Nginx: nginx.conf bearbeiten**
  ```nginx
  # Kopiere aus DEPLOYMENT-SECURITY.txt
  # HTTPS Redirect + Security Headers
  ```

- [ ] **Testen:**
  - http://deine-domain.com → sollte zu https:// redirecten
  - https://deine-domain.com → sollte grünes Schloss zeigen

---

## ✅ PHASE 3: DATEIEN HOCHLADEN (Tag 2-3)

### 3.1 FTP/SFTP Verbindung einrichten
- [ ] **Zugangsdaten vom Hosting-Provider erhalten:**
  - FTP-Host: `ftp.deine-domain.com`
  - Username: `username`
  - Password: `***********`
  - Port: 21 (FTP) oder 22 (SFTP)

- [ ] **FTP-Client installieren:**
  - FileZilla (kostenlos): https://filezilla-project.org/
  - Cyberduck (Mac/Win): https://cyberduck.io/
  - WinSCP (Windows): https://winscp.net/

### 3.2 Upload-Struktur
**Hochzuladen in Root-Verzeichnis (meist `public_html/` oder `www/`):**

```
public_html/
├── index.html                    ✅ Hauptseite
├── 404.html                      ✅ Custom Error Page
├── .htaccess                     ✅ (nur bei Apache!)
├── assets/
│   ├── css/
│   │   ├── styles.min.css        ✅ Minified (38KB)
│   │   └── faq-footer.min.css    ✅ Minified (10KB)
│   ├── js/
│   │   ├── main.min.js           ✅ Minified (19.5KB)
│   │   └── faq.min.js            ✅ Minified (3.5KB)
│   └── images/
│       ├── logo.png              ✅ Branding
│       └── og-image.png          ✅ Social Media Preview
```

### 3.3 NICHT hochladen (bleiben lokal):
- ❌ `node_modules/` Ordner (zu groß, nicht nötig)
- ❌ `.git/` Ordner (Git-History)
- ❌ `.css` und `.js` NICHT-minified (außer als Backup)
- ❌ `minify.js` (nur für Entwicklung)
- ❌ `package.json`, `package-lock.json`
- ❌ Alle `.md` Dokumentationsdateien

### 3.4 Upload-Checklist
- [ ] `index.html` hochgeladen → Root
- [ ] `404.html` hochgeladen → Root
- [ ] `.htaccess` hochgeladen → Root (nur Apache!)
- [ ] `assets/css/*.min.css` hochgeladen
- [ ] `assets/js/*.min.js` hochgeladen
- [ ] `assets/images/*.png` hochgeladen
- [ ] Verzeichnisrechte prüfen: 755 für Ordner, 644 für Dateien

---

## ✅ PHASE 4: SERVER-KONFIGURATION (Tag 3)

### 4.1 Custom 404 Page aktivieren

**Apache-Server (.htaccess):**
```apache
# 404 Error Page - Custom Error Document
ErrorDocument 404 /404.html
```

**Nginx-Server (nginx.conf):**
```nginx
# Custom 404 Error Page
error_page 404 /404.html;
location = /404.html {
    internal;
}
```

- [ ] Datei bearbeitet und hochgeladen
- [ ] Server neu gestartet (falls Nginx):
  ```bash
  sudo systemctl restart nginx
  ```

### 4.2 Security Headers überprüfen
- [ ] Alle Headers aus `DEPLOYMENT-SECURITY.txt` aktiv?
  - Content-Security-Policy
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Referrer-Policy: no-referrer
  - Strict-Transport-Security (HSTS)

---

## ✅ PHASE 5: LIVE-TESTS (Tag 3-4)

### 5.1 Basis-Funktionalität
- [ ] **Hauptseite laden:** https://deine-domain.com
  - Lädt index.html korrekt? ✅
  - CSS-Styles angewendet? ✅
  - Gold Particles.js funktioniert? ✅
  - Logo sichtbar? ✅

### 5.2 Button-Tests
- [ ] **Hero Section:**
  - [ ] "I'M READY" Button klicken → Zeigt Payment Section?
  - [ ] "I'M NOT THERE YET" Button klicken → Zeigt Rejection Screen?

- [ ] **Rejection Screen:**
  - [ ] "100 TOTAL SLOTS" Badge sichtbar?
  - [ ] "I'M READY NOW" Button → Zurück zu Hero Section?
  - [ ] "I ACCEPT THE RISK" Button → Alert + Page Reload?
  - [ ] Red Particles.js funktioniert?

- [ ] **FAQ Section:**
  - [ ] FAQ-Items klappbar?
  - [ ] "CONTACT US" Button → Email Popup?
  - [ ] Email Copy-Button funktioniert?
  - [ ] Modals öffnen/schließen?

### 5.3 404 Page Test
- [ ] Falsche URL eingeben: `https://deine-domain.com/test123`
  - Zeigt custom 404.html (nicht Server-Default)?
  - Gold Particles.js funktioniert?
  - "RETURN HOME" Button klicken → Zurück zu index.html?
  - Montserrat Font korrekt geladen?

### 5.4 Mobile Responsiveness
- [ ] **iPhone Safari testen:**
  - Buttons klickbar?
  - Text lesbar (keine Überlappung)?
  - Particles.js funktioniert?
  - Scroll smooth?

- [ ] **Android Chrome testen:**
  - Alles wie oben ✅

- [ ] **Responsive Breakpoints:**
  - 320px (kleine Phones)
  - 768px (Tablets)
  - 1024px (Laptops)
  - 1920px (Desktops)

### 5.5 Browser-Kompatibilität
- [ ] Chrome (Desktop + Mobile)
- [ ] Firefox
- [ ] Safari (Mac + iOS)
- [ ] Edge

### 5.6 Performance-Tests
- [ ] **Google PageSpeed Insights:** https://pagespeed.web.dev/
  - Desktop Score: >90 ✅
  - Mobile Score: >80 ✅
  - First Contentful Paint: <1s ✅

- [ ] **GTmetrix:** https://gtmetrix.com/
  - Performance Score: A ✅
  - Structure Score: A ✅
  - Fully Loaded Time: <2s ✅

### 5.7 Security-Tests
- [ ] **SecurityHeaders.com:** https://securityheaders.com/
  - Rating: A oder besser ✅
  - Alle Headers aktiv ✅

- [ ] **SSL Labs:** https://www.ssllabs.com/ssltest/
  - Rating: A oder A+ ✅
  - TLS 1.3 aktiv ✅
  - HSTS aktiviert ✅

---

## ✅ PHASE 6: MONITORING & ANALYTICS (Tag 4-5)

### 6.1 Uptime-Monitoring einrichten
- [ ] **UptimeRobot (kostenlos):** https://uptimerobot.com/
  - Monitoring-Intervall: 5 Minuten
  - Alert via Email/SMS bei Downtime
  - HTTP(s) Check auf https://deine-domain.com

### 6.2 Google Analytics (Optional)
- [ ] Google Analytics Account erstellen
- [ ] Tracking-Code in `index.html` einbauen
- [ ] Event-Tracking für Buttons konfigurieren
- [ ] Conversion-Tracking für "I'M READY" Button

**ACHTUNG:** Analytics widerspricht Anonymität-Prinzip!
- Nur verwenden mit Cookie-Banner
- DSGVO-konform konfigurieren
- IP-Anonymisierung aktivieren

### 6.3 Error-Tracking (Optional)
- [ ] Sentry (JavaScript Error Tracking): https://sentry.io/
- [ ] LogRocket (Session Replay): https://logrocket.com/
- [ ] Nur bei kritischen Bugs nötig

---

## ✅ PHASE 7: LEGAL & COMPLIANCE (Tag 5)

### 7.1 Impressum (Deutschland/Schweiz PFLICHT)
- [ ] **Vollständige Angaben:**
  - Firmenname / Vollständiger Name
  - Adresse (Postanschrift)
  - E-Mail-Adresse
  - Telefonnummer
  - USt-IdNr. (bei Gewerbetreibenden)
  - Handelsregisternummer (bei Firmen)

- [ ] Link im Footer sichtbar: "Impressum"

### 7.2 Datenschutzerklärung (DSGVO)
- [ ] **Inhalt:**
  - Welche Daten werden gesammelt?
  - Cookies? Google Analytics?
  - Rechte der Nutzer (Auskunft, Löschung, Widerspruch)
  - Verantwortlicher für Datenverarbeitung
  - Auftragsverarbeiter (Hosting-Provider)

- [ ] **Generator verwenden:**
  - https://www.datenschutz-generator.de/
  - https://www.e-recht24.de/muster-datenschutzerklaerung.html

- [ ] Link im Footer: "Datenschutz"

### 7.3 AGB (Terms of Service)
- [ ] **Inhalte:**
  - Was wird angeboten? (Definition)
  - Zahlungsbedingungen (500K CHF)
  - Widerrufsrecht (bei digitalen Produkten?)
  - Haftungsausschlüsse
  - Gerichtsstand

- [ ] Link im Footer: "AGB" oder "Terms"

### 7.4 Cookie-Banner (falls Tracking)
- [ ] Cookie-Banner einbauen (bei Google Analytics PFLICHT)
- [ ] "Ablehnen" Option anbieten
- [ ] Cookie-Liste dokumentieren

---

## ✅ PHASE 8: BACKUP & ROLLBACK (Tag 6)

### 8.1 Backup erstellen
- [ ] **Lokale Kopie aller Dateien:**
  - Ordner: `Billionairs_Backup_2025-10-20.zip`
  - Inhalt: Alle HTML/CSS/JS/Images
  - .htaccess / nginx.conf

- [ ] **Hosting-Backup:**
  - Control Panel → Backup erstellen
  - Download lokal speichern

- [ ] **Git Repository (optional):**
  ```bash
  git init
  git add .
  git commit -m "Pre-Launch Version 1.0"
  git remote add origin https://github.com/user/billionairs
  git push -u origin main
  ```

### 8.2 Rollback-Plan definieren
**Bei kritischen Bugs nach Launch:**
1. **Sofort:** "Coming Soon" Page hochladen
2. **Analyse:** Fehler identifizieren (Browser Console, Server Logs)
3. **Fix:** Lokal reparieren + testen
4. **Deployment:** Reparierte Version hochladen
5. **Verify:** Finale Tests wiederholen

- [ ] "Coming Soon" Page vorbereitet (einfaches HTML)
- [ ] Maintenance Mode Template bereit

---

## ✅ PHASE 9: FINAL LAUNCH (Tag 7 - GO LIVE!)

### 9.1 Pre-Launch Checklist (24h vor GO-LIVE)
- [ ] **DNS-Propagation abgeschlossen?** (24-48h nach DNS-Änderung)
  - Test: https://www.whatsmydns.net/
  - Domain sollte weltweit erreichbar sein

- [ ] **Alle Tests bestanden:**
  - ✅ Buttons funktionieren
  - ✅ 404 Page zeigt custom Design
  - ✅ Mobile Responsiveness OK
  - ✅ Performance Score >90
  - ✅ Security Headers aktiv

- [ ] **Team informiert:**
  - Launch-Zeitpunkt kommunizieren
  - Support-Team bereit

- [ ] **Support-Email prüfen:**
  - Posteingang aktiv und überwacht
  - Auto-Reply konfiguriert

### 9.2 Launch-Moment
**Uhrzeit:** ___:___ Uhr (festlegen!)

- [ ] **Cache leeren:**
  - Browser-Cache: Strg+Shift+R
  - Cloudflare Cache: "Purge Everything"
  - CDN Cache leeren

- [ ] **Finale Smoke-Tests:**
  - Index.html laden
  - Alle Buttons klicken
  - 404 Page testen
  - Mobile Check

- [ ] **Monitoring aktivieren:**
  - UptimeRobot Alerts aktivieren
  - Browser-Tab offen lassen für Echtzeit-Checks

### 9.3 Post-Launch Monitoring (Erste 24h)
- [ ] **Stündlich prüfen:**
  - Website erreichbar?
  - Fehler in Browser Console?
  - Server-Logs checken
  - Performance stabil?

- [ ] **Analytics beobachten:**
  - Traffic-Zahlen
  - Button-Klicks
  - Conversion-Rate

- [ ] **Support-Anfragen:**
  - Email-Posteingang überwachen
  - Schnelle Reaktionszeit (<2h)

---

## 🚨 KRITISCHE GO-LIVE FILES

**Diese Dateien MÜSSEN auf Server sein:**

| Datei | Größe | Zweck | Priorität | Warum kritisch? |
|-------|-------|-------|-----------|-----------------|
| `index.html` | 29.72KB | Hauptseite | 🔥 KRITISCH | **Ohne diese Datei = Keine Website!** Dies ist die erste Seite die Besucher sehen. Enthält gesamte Hero Section, Payment Section, FAQ, Footer. Ohne index.html zeigt Server nur Fehler. |
| `404.html` | 14.73KB | Custom Error | 🔥 KRITISCH | **Ohne diese = Unprofessionelles Server-Error!** Wenn User falsche URL eingibt, zeigt Server default Error (hässlich). Custom 404 = Luxus-Branding selbst bei Fehlern. Shows "The Wrong Door" statt "404 Not Found". |
| `.htaccess` (Apache) | ~6KB | Security + HTTPS | 🔥 KRITISCH | **Ohne diese = KEINE SECURITY!** Erzwingt HTTPS (ohne = unsicher), aktiviert Security Headers (XSS-Schutz), ermöglicht custom 404 Page. OHNE = Anfällig für Angriffe! |
| `assets/css/styles.min.css` | 38.29KB | Design | 🔥 KRITISCH | **Ohne diese = Komplett kaputtes Design!** Enthält ALLE Styles: Hero Section, Buttons, Particles, Animations, Rejection Screen, Colors, Fonts. Ohne = Website ist nur weißer Text auf weißem Hintergrund (unbrauchbar). |
| `assets/css/faq-footer.min.css` | 10.07KB | FAQ-Design | 🔥 KRITISCH | **Ohne diese = FAQ Section unsichtbar!** FAQ Accordion, Modal Popups, Footer-Design, Contact Button. Ohne = Untere Hälfte der Website funktioniert nicht. |
| `assets/js/main.min.js` | 19.5KB | Funktionalität | 🔥 KRITISCH | **Ohne diese = KEINE BUTTONS funktionieren!** Enthält alle Event Listeners: "I'M READY" Button, "NOT READY" Button, Rejection Screen Logic, Particles.js Init. Ohne = Buttons sind tote Klicks (nichts passiert). |
| `assets/js/faq.min.js` | 3.51KB | FAQ-Logic | 🔥 KRITISCH | **Ohne diese = FAQ nicht klickbar!** Accordion öffnen/schließen, Modal Popups, Email Copy-Button, Contact Form. Ohne = FAQ Section ist statisch (kein Interact). |
| `assets/images/logo.png` | ? | Branding | ⚠️ WICHTIG | Ohne = Kein Logo, aber Website funktioniert. Nur für Branding wichtig. |
| `assets/images/og-image.png` | ? | Social Media | ⚠️ WICHTIG | Ohne = Kein Preview-Bild bei Share. Nur für Social Media wichtig. |

---

## 📞 NOTFALL-KONTAKTE

**VOR LAUNCH AUSFÜLLEN:**

- **Hosting-Provider Support:**
  - Name: _______________
  - Hotline: _______________
  - Email: _______________
  - Live-Chat: _______________

- **Domain-Provider Support:**
  - Name: _______________
  - Hotline: _______________
  - Email: _______________

- **Developer/Admin:**
  - Name: _______________
  - Telefon: _______________
  - Email: _______________
  - Verfügbarkeit: 24/7 oder nur Geschäftszeiten?

- **Cloudflare Support** (falls verwendet):
  - Dashboard: https://dash.cloudflare.com/
  - Support: https://support.cloudflare.com/

---

## ✅ LAUNCH STATUS TRACKER

### Timeline:
- [ ] **Tag 1-2:** Domain + Hosting Setup ⏳
- [ ] **Tag 2:** SSL aktiviert ⏳
- [ ] **Tag 2-3:** Dateien hochgeladen ⏳
- [ ] **Tag 3:** Server-Konfiguration ⏳
- [ ] **Tag 3-4:** Live-Tests ⏳
- [ ] **Tag 4-5:** Monitoring Setup ⏳
- [ ] **Tag 5:** Legal Compliance ⏳
- [ ] **Tag 6:** Backup & Rollback ⏳
- [ ] **Tag 7:** 🚀 GO LIVE! ⏳

### Entscheidungen:
- **Domain:** _______________ (noch zu kaufen)
- **Hosting:** _______________ (noch zu wählen)
- **SSL:** _______________ (Let's Encrypt / Cloudflare / Other)
- **Server-Typ:** _______________ (Apache / Nginx)
- **Launch-Datum:** ___.___.2025
- **Launch-Uhrzeit:** ___:___ Uhr

---

## 🎯 SUCCESS CRITERIA (Launch als Erfolg werten wenn:)

- ✅ Website unter https://deine-domain.com erreichbar
- ✅ Alle Buttons funktionieren (Hero + Rejection + FAQ)
- ✅ 404 Page zeigt custom Design bei falschen URLs
- ✅ Mobile Responsiveness funktioniert auf iPhone + Android
- ✅ Performance Score >90 (PageSpeed Insights)
- ✅ Security Score A (SecurityHeaders.com)
- ✅ SSL Score A+ (SSL Labs)
- ✅ Erste 24h ohne kritische Bugs
- ✅ Support-Email erreichbar und reagiert
- ✅ Monitoring aktiv und Alerts funktionieren

---

**NACH ERFOLGREICHEM LAUNCH:**
→ Siehe `FUTURE-PLANS.md` für Phase 2 (Payment Site) und Phase 3 (Mobile Apps)

---

**VIEL ERFOLG BEIM LAUNCH! 🚀💎**
