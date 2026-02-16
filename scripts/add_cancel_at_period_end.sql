-- Add column to track if subscription will cancel at period end
-- This allows keeping subscription active until the paid period expires

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS paypal_cancel_at_period_end BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.paypal_cancel_at_period_end IS 'If true, subscription will not renew and will expire at next billing time';
