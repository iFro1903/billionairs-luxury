-- Migration: Add stripe_payment_id column to payments table
-- Date: 2025-11-01
-- Purpose: Fix verify-payment error - add missing stripe_payment_id column

-- Add stripe_payment_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'stripe_payment_id'
    ) THEN
        ALTER TABLE payments 
        ADD COLUMN stripe_payment_id VARCHAR(255) UNIQUE;
        
        RAISE NOTICE 'Added stripe_payment_id column to payments table';
    ELSE
        RAISE NOTICE 'stripe_payment_id column already exists';
    END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_stripe_id 
ON payments(stripe_payment_id);

-- Add comment for documentation
COMMENT ON COLUMN payments.stripe_payment_id IS 'Stripe payment intent ID for tracking';
