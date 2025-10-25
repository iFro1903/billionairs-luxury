-- Add file support to chat_messages
ALTER TABLE chat_messages
ADD COLUMN file_url TEXT,
ADD COLUMN file_name TEXT,
ADD COLUMN file_type VARCHAR(20);

-- file_type can be: 'image', 'file', or NULL for text-only messages
