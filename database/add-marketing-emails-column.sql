-- ADD MARKETING_EMAILS COLUMN TO USERS TABLE
-- For GDPR compliance - users can unsubscribe from marketing emails

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN DEFAULT true;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_marketing_emails ON users(marketing_emails) WHERE marketing_emails = true;

-- Success message
SELECT '✅ Marketing emails column added!' as message;
