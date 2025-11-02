-- Update User Names in Database
-- Run this in your Neon SQL Console to add names to existing users

-- Update your account (bilionairs@hotmail.com)
UPDATE users 
SET first_name = 'Furkan', 
    last_name = 'Akaslan'
WHERE email = 'bilionairs@hotmail.com';

-- Verify the update
SELECT email, first_name, last_name, member_id 
FROM users 
WHERE email = 'bilionairs@hotmail.com';

-- Optional: Update other users if needed
-- UPDATE users 
-- SET first_name = 'FirstName', 
--     last_name = 'LastName'
-- WHERE email = 'other@email.com';
