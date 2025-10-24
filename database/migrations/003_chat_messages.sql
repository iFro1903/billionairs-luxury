-- Chat Messages Table Migration
-- Run this in Neon Console to create chat_messages table

CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster message retrieval
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Add last_seen column to users table (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
