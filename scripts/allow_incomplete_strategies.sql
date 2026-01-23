-- Allow nullable fields for incomplete strategies
-- This allows users to save incomplete strategies from the preview page

-- Remove NOT NULL constraint from trading_pair
ALTER TABLE public.strategies ALTER COLUMN trading_pair DROP NOT NULL;

-- Remove NOT NULL constraint from market_type (but keep the check constraint)
ALTER TABLE public.strategies DROP CONSTRAINT IF EXISTS strategies_market_type_check;
ALTER TABLE public.strategies ALTER COLUMN market_type DROP NOT NULL;
ALTER TABLE public.strategies ADD CONSTRAINT strategies_market_type_check 
  CHECK (market_type IS NULL OR market_type IN ('spot', 'futures'));

-- Remove NOT NULL constraint from risk_type (but keep the check constraint)
ALTER TABLE public.strategies DROP CONSTRAINT IF EXISTS strategies_risk_type_check;
ALTER TABLE public.strategies ALTER COLUMN risk_type DROP NOT NULL;
ALTER TABLE public.strategies ADD CONSTRAINT strategies_risk_type_check 
  CHECK (risk_type IS NULL OR risk_type IN ('fixed_quantity', 'fixed_amount', 'percentage'));

-- Remove NOT NULL constraint from risk_value (but keep the check constraint for positive values when not null)
ALTER TABLE public.strategies DROP CONSTRAINT IF EXISTS strategies_risk_value_check;
ALTER TABLE public.strategies ALTER COLUMN risk_value DROP NOT NULL;
ALTER TABLE public.strategies ADD CONSTRAINT strategies_risk_value_check 
  CHECK (risk_value IS NULL OR risk_value > 0);

-- Make exchange_id nullable (if not already)
ALTER TABLE public.strategies ALTER COLUMN exchange_id DROP NOT NULL;

-- Make exchange_name nullable
ALTER TABLE public.strategies ALTER COLUMN exchange_name DROP NOT NULL;

-- Make leverage nullable
ALTER TABLE public.strategies ALTER COLUMN leverage DROP NOT NULL;

-- Add position_side column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'strategies' AND column_name = 'position_side') THEN
    ALTER TABLE public.strategies ADD COLUMN position_side text;
  END IF;
END $$;

-- Add check constraint for position_side
ALTER TABLE public.strategies DROP CONSTRAINT IF EXISTS strategies_position_side_check;
ALTER TABLE public.strategies ADD CONSTRAINT strategies_position_side_check 
  CHECK (position_side IS NULL OR position_side IN ('long', 'short'));
