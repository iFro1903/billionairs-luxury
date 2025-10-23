-- Easter Egg System: Pyramide & Auge
-- Füge neue Felder zur users Tabelle hinzu

ALTER TABLE users ADD COLUMN IF NOT EXISTS first_dashboard_access TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pyramid_unlocked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pyramid_opened_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS eye_unlocked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS eye_opened_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS chat_unlocked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_daily_login TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_streak INTEGER DEFAULT 0;

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_first_dashboard_access ON users(first_dashboard_access);
CREATE INDEX IF NOT EXISTS idx_pyramid_unlocked ON users(pyramid_unlocked);
CREATE INDEX IF NOT EXISTS idx_eye_unlocked ON users(eye_unlocked);
CREATE INDEX IF NOT EXISTS idx_chat_unlocked ON users(chat_unlocked);

COMMENT ON COLUMN users.first_dashboard_access IS 'Erster Zugriff auf Dashboard nach Payment (für 20-Sekunden Pyramide Timer)';
COMMENT ON COLUMN users.pyramid_unlocked IS 'Pyramide wurde angeklickt und Rätsel gelesen';
COMMENT ON COLUMN users.pyramid_opened_at IS 'Zeitpunkt wann Pyramide zum ersten Mal geöffnet wurde';
COMMENT ON COLUMN users.eye_unlocked IS 'Auge wurde freigeschaltet (nach 72h)';
COMMENT ON COLUMN users.eye_opened_at IS 'Zeitpunkt wann Auge zum ersten Mal geöffnet wurde';
COMMENT ON COLUMN users.chat_unlocked IS 'Chat wurde freigeschaltet (nach 168h ab eye_opened_at)';
COMMENT ON COLUMN users.last_daily_login IS 'Letzter täglicher Login (für Streak Tracking)';
COMMENT ON COLUMN users.login_streak IS 'Anzahl aufeinanderfolgender Tage mit Login';
