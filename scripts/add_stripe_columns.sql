-- Add Stripe-related columns to profiles table for subscription management
-- Run this migration after setting up Stripe integration

-- Add Stripe customer ID column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Add Stripe subscription ID column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add subscription status column
-- Possible values: 'active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired'
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_subscription_status TEXT;

-- Add current period end timestamp (when the current billing period ends)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_current_period_end TIMESTAMP WITH TIME ZONE;

-- Add trial end timestamp (when the trial ends, null if not on trial)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Create index on stripe_customer_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
ON public.profiles(stripe_customer_id);

-- Create index on stripe_subscription_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id
ON public.profiles(stripe_subscription_id);

-- Add comment to document the columns
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN public.profiles.stripe_subscription_id IS 'Active Stripe subscription ID';
COMMENT ON COLUMN public.profiles.stripe_subscription_status IS 'Current Stripe subscription status';
COMMENT ON COLUMN public.profiles.stripe_current_period_end IS 'End of current billing period';
COMMENT ON COLUMN public.profiles.trial_ends_at IS 'End of trial period (null if not on trial)';
