# 🗄️ DATABASE SETUP ANLEITUNG

## ✅ **SCHRITT 1: Vercel Postgres aktivieren**

1. Gehe zu https://vercel.com/dashboard
2. Wähle dein Projekt "billionairs-luxury"
3. Gehe zu "Storage" Tab
4. Klicke "Create Database"
5. Wähle "Postgres"
6. Gib einen Namen ein: `billionairs-db`
7. Region: `Frankfurt, Germany` (näher = schneller)
8. Klicke "Create"

---

## ✅ **SCHRITT 2: Environment Variables werden automatisch gesetzt**

Vercel fügt automatisch diese Variablen hinzu:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

**Du musst NICHTS manuell eingeben!** ✨

---

## ✅ **SCHRITT 3: Datenbank-Tabellen erstellen**

**Option A: Über Browser (EMPFOHLEN)**

1. Gehe zu: `https://billionairs-luxury.vercel.app/api/db-setup`
2. Du solltest sehen: `{"success":true,"message":"Database setup complete"}`
3. Fertig! ✅

**Option B: Über Vercel Dashboard**

1. Gehe zu Storage → billionairs-db → Query
2. Kopiere und führe SQL aus (aus `api/db-setup.js`)

---

## 📊 **DATENBANK-STRUKTUR**

### **`users` Tabelle**
```sql
- id (PRIMARY KEY)
- email (UNIQUE)
- password_hash
- member_id (UNIQUE) - z.B. "BILL-1729526400-ABC123XYZ"
- payment_status ('pending' oder 'paid')
- created_at
- paid_at
- last_login
```

### **`sessions` Tabelle**
```sql
- id (PRIMARY KEY)
- token (UNIQUE)
- user_id (FOREIGN KEY → users)
- created_at
- expires_at (24h nach Login)
```

### **`payments` Tabelle**
```sql
- id (PRIMARY KEY)
- user_id (FOREIGN KEY → users)
- amount (z.B. 500000.00)
- currency (CHF)
- payment_method (card/wire/crypto)
- transaction_id
- status ('pending'/'completed')
- created_at
- completed_at
```

### **`downloads` Tabelle**
```sql
- id (PRIMARY KEY)
- user_id (FOREIGN KEY → users)
- file_name
- downloaded_at
- ip_address
```

---

## 🔍 **TESTEN**

Nach Setup kannst du testen:

1. **Registrierung testen:**
   ```
   Gehe zu: /login.html
   Registriere dich mit Email + Passwort
   ```

2. **Login testen:**
   ```
   Logge dich mit den Credentials ein
   ```

3. **Dashboard testen:**
   ```
   Nach Login solltest du /dashboard.html sehen
   Status: "Pending Payment"
   ```

4. **Datenbank prüfen:**
   ```
   Vercel Dashboard → Storage → billionairs-db → Browse
   Tabelle "users" sollte deinen User zeigen
   ```

---

## ⚠️ **WICHTIG**

- ✅ Datenbank ist **persistent** (Daten bleiben erhalten)
- ✅ Automatische **Backups** durch Vercel
- ✅ **Kostenlos** bis 256 MB Speicher
- ✅ **Sicher** - Verschlüsselte Verbindung

---

## 🚀 **NÄCHSTE SCHRITTE**

Nach erfolgreichem Setup:

1. ✅ User können sich registrieren/login
2. ✅ Sessions werden gespeichert
3. ⏳ Payment-Integration fertigstellen
4. ⏳ Download-Funktion für TIME IS WEALTH Uhr

---

## 📞 **SUPPORT**

Bei Problemen:
1. Check Vercel Logs: Dashboard → Functions → Logs
2. Check Database: Dashboard → Storage → Query
3. Fehler in Browser Console (F12)
