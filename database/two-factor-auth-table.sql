-- TWO FACTOR AUTH TABELLE
-- Diese Tabelle speichert die 2FA Secrets für Admin-Login

CREATE TABLE IF NOT EXISTS two_factor_auth (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL UNIQUE,
    secret VARCHAR(255) NOT NULL,
    backup_codes TEXT,
    enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used TIMESTAMP
);

-- Index für schnelle Email-Suche
CREATE INDEX IF NOT EXISTS idx_two_factor_email ON two_factor_auth(user_email);

-- Success Message
SELECT '✅ Two Factor Auth Table Created!' as message;
