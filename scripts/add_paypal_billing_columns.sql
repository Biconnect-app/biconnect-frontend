-- Add missing PayPal billing columns to profiles table
-- This script adds columns for better tracking of PayPal subscription details

-- Drop old Stripe constraints if they exist (constraint before index)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_stripe_customer_id_key;
DROP INDEX IF EXISTS profiles_stripe_customer_id_key;

-- Rename paypal_subscription_status to paypal_status (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='profiles' 
        AND column_name='paypal_subscription_status'
    ) THEN
        ALTER TABLE public.profiles 
        RENAME COLUMN paypal_subscription_status TO paypal_status;
    END IF;
END $$;

-- Add paypal_status column if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS paypal_status TEXT;

-- Add paypal_plan_type column if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS paypal_plan_type TEXT;

-- Add paypal_next_billing_time column if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS paypal_next_billing_time TIMESTAMPTZ;

-- Ensure trial_ends_at exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Add comments
COMMENT ON COLUMN public.profiles.paypal_status IS 'Current PayPal subscription status (trialing, active, suspended, canceled, expired)';
COMMENT ON COLUMN public.profiles.paypal_plan_type IS 'Type of subscription plan (monthly, annual)';
COMMENT ON COLUMN public.profiles.paypal_next_billing_time IS 'Date and time of next billing cycle';
COMMENT ON COLUMN public.profiles.trial_ends_at IS 'Date and time when trial period ends';

-- Create index for next_billing_time for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_paypal_next_billing_time
ON public.profiles(paypal_next_billing_time);
