-- Fix: rename paypal_subscription_status to paypal_status for consistency
-- and add missing paypal_plan_type column
ALTER TABLE profiles RENAME COLUMN paypal_subscription_status TO paypal_status;

-- Add paypal_plan_type column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS paypal_plan_type text;
