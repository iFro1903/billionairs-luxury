-- Add missing member_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS member_id VARCHAR(100) UNIQUE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_member_id ON users(member_id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
