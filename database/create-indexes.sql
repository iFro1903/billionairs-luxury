-- Database Performance Optimierung: Indexes
-- Run this in Neon SQL Editor

-- Users Table Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_payment_status ON users(payment_status);
CREATE INDEX IF NOT EXISTS idx_users_member_id ON users(member_id);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at DESC);

-- Chat Messages Indexes
CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_email ON chat_messages(email);
CREATE INDEX IF NOT EXISTS idx_chat_sender ON chat_messages(sender);

-- Audit Logs Indexes
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_ip ON audit_logs(ip);

-- Payments Table Indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date DESC);

-- Rate Limits Indexes
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint ON rate_limits(ip, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

-- Blocked IPs Indexes
CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip ON blocked_ips(ip);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_active ON blocked_ips(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_blocked_ips_expires ON blocked_ips(expires_at) WHERE expires_at IS NOT NULL;

-- Two Factor Auth Indexes
CREATE INDEX IF NOT EXISTS idx_2fa_user ON two_factor_auth(user_email);
CREATE INDEX IF NOT EXISTS idx_2fa_enabled ON two_factor_auth(enabled) WHERE enabled = true;

-- Backup Logs Indexes (already created in backup-logs-table.sql, but for completeness)
CREATE INDEX IF NOT EXISTS idx_backup_logs_created ON backup_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_logs_status ON backup_logs(status);

SELECT 'All performance indexes created successfully! 🚀' as message;

-- Verify indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
