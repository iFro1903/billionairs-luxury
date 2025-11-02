-- Chat Messages Performance Index
-- Run this SQL in your Neon database console
-- This index speeds up time-based queries like "WHERE created_at >= NOW() - INTERVAL '7 days'"

CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at 
ON chat_messages(created_at DESC);

-- Also useful: composite index with email for CEO queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_email_created 
ON chat_messages(email, created_at DESC);

-- Verify indexes were created
SELECT 
    schemaname, 
    tablename, 
    indexname, 
    indexdef
FROM pg_indexes 
WHERE tablename = 'chat_messages';
