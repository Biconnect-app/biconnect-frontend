-- Migration: Rename Stripe columns to PayPal columns in profiles table
-- This migration replaces the Stripe subscription system with PayPal

-- Rename stripe_customer_id to paypal_subscriber_id
ALTER TABLE public.profiles
RENAME COLUMN stripe_customer_id TO paypal_subscriber_id;

-- Rename stripe_subscription_id to paypal_subscription_id
ALTER TABLE public.profiles
RENAME COLUMN stripe_subscription_id TO paypal_subscription_id;

-- Rename stripe_subscription_status to paypal_subscription_status
ALTER TABLE public.profiles
RENAME COLUMN stripe_subscription_status TO paypal_subscription_status;

-- Rename stripe_current_period_end to paypal_current_period_end
ALTER TABLE public.profiles
RENAME COLUMN stripe_current_period_end TO paypal_current_period_end;

-- Drop old indexes
DROP INDEX IF EXISTS idx_profiles_stripe_customer_id;
DROP INDEX IF EXISTS idx_profiles_stripe_subscription_id;

-- Create new indexes for PayPal columns
CREATE INDEX IF NOT EXISTS idx_profiles_paypal_subscriber_id
ON public.profiles(paypal_subscriber_id);

CREATE INDEX IF NOT EXISTS idx_profiles_paypal_subscription_id
ON public.profiles(paypal_subscription_id);

-- Update comments
COMMENT ON COLUMN public.profiles.paypal_subscriber_id IS 'PayPal subscriber/payer ID';
COMMENT ON COLUMN public.profiles.paypal_subscription_id IS 'Active PayPal subscription ID';
COMMENT ON COLUMN public.profiles.paypal_subscription_status IS 'Current PayPal subscription status (ACTIVE, SUSPENDED, CANCELLED, EXPIRED)';
COMMENT ON COLUMN public.profiles.paypal_current_period_end IS 'End of current billing period';

-- trial_ends_at and plan columns remain unchanged
