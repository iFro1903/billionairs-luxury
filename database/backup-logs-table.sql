-- Database Backup Logs Table
-- Run this in Neon SQL Editor

CREATE TABLE IF NOT EXISTS backup_logs (
    id SERIAL PRIMARY KEY,
    backup_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    users_count INTEGER,
    payments_count INTEGER,
    chat_count INTEGER,
    audit_count INTEGER,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_backup_logs_created ON backup_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_logs_status ON backup_logs(status);

-- Insert initial log
INSERT INTO backup_logs (backup_type, status, created_at)
VALUES ('manual_table_creation', 'completed', NOW());

SELECT 'Backup logs table created successfully!' as message;
