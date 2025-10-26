-- ============================================================================
-- Push Notifications Database Migration
-- ============================================================================
-- 
-- Erstellt die Tabelle für Push Notification Subscriptions
-- Ausführen in: Neon SQL Editor (https://console.neon.tech)
--

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255),
    endpoint TEXT NOT NULL UNIQUE,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    user_agent TEXT,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_notification_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_email 
    ON push_subscriptions(user_email);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active 
    ON push_subscriptions(is_active) 
    WHERE is_active = true;

-- Verify table creation
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'push_subscriptions'
ORDER BY 
    ordinal_position;

-- Show count
SELECT COUNT(*) as total_subscriptions FROM push_subscriptions;

COMMENT ON TABLE push_subscriptions IS 'Stores Web Push notification subscriptions for users';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'Push service endpoint URL';
COMMENT ON COLUMN push_subscriptions.p256dh_key IS 'Client public key for encryption';
COMMENT ON COLUMN push_subscriptions.auth_key IS 'Authentication secret';
COMMENT ON COLUMN push_subscriptions.is_active IS 'Whether subscription is still active';

-- ============================================================================
-- Migration Complete ✓
-- ============================================================================
