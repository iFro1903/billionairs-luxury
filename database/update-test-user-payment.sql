-- ============================================================================
-- Update Test User Payment Status
-- ============================================================================
-- 
-- Execution: Neon SQL Editor (https://console.neon.tech)
-- Purpose: Set payment status to 'paid' for test user
-- Email: billionairstest@outlook.com
--

-- Update payment status
UPDATE users 
SET 
    payment_status = 'paid',
    updated_at = NOW()
WHERE 
    email = 'billionairstest@outlook.com';

-- Verify the update
SELECT 
    id,
    email,
    payment_status,
    created_at,
    updated_at
FROM 
    users
WHERE 
    email = 'billionairstest@outlook.com';

-- ============================================================================
-- Expected Result:
-- User should now have payment_status = 'paid'
-- ============================================================================
