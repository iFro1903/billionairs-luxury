# 🔐 Vercel Environment Variable Setup

## ADMIN_PASSWORD_HASH hinzufügen

### Schritt 1: Vercel Dashboard öffnen
1. Gehe zu: https://vercel.com/ifro1903/billionairs-luxury
2. Klicke auf **Settings** Tab
3. Klicke auf **Environment Variables** im linken Menü

### Schritt 2: Neue Variable hinzufügen
1. Klicke auf **Add New**
2. Fülle folgende Felder aus:

**Name:**
```
ADMIN_PASSWORD_HASH
```

**Value:**
```
$2a$10$ixGBrp4borRNUeziNucSeu2qfYOyblVbrE7A9hZnOhekZNpIaEqrG
```

**Environment:** 
- ✅ Production
- ✅ Preview
- ✅ Development

3. Klicke auf **Save**

### Schritt 3: Deployment neu auslösen
Nach dem Speichern der Variable:
1. Gehe zum **Deployments** Tab
2. Klicke auf das letzte Deployment
3. Klicke auf die 3 Punkte (**...**)
4. Klicke auf **Redeploy**
5. Bestätige mit **Redeploy**

### ✅ Fertig!
Nach dem Redeployment ist das Admin Passwort mit bcrypt gesichert.

---

## Passwort ändern (optional)

Falls du das Passwort später ändern möchtest:

### Lokaler Hash erstellen:
```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('DEIN_NEUES_PASSWORT', 10));"
```

### In Vercel aktualisieren:
1. Environment Variables → ADMIN_PASSWORD_HASH
2. Klicke auf **Edit**
3. Füge den neuen Hash ein
4. **Save** → **Redeploy**

---

## 🔒 Sicherheitshinweise

- ✅ Passwort nie im Code speichern
- ✅ Nur bcrypt Hash in Environment Variables
- ✅ Hash nie im Git Repository committen
- ✅ Bei Verdacht auf Kompromittierung sofort ändern

**Aktuelles Passwort:** `Masallah1,` (nur du kennst es)
**Hash-Algorithmus:** bcrypt (10 Rounds)
