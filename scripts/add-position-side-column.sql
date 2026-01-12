-- Add position_side column to strategies table for futures direction
ALTER TABLE strategies
ADD COLUMN IF NOT EXISTS position_side text CHECK (position_side IN ('long', 'short'));

-- Add comment to describe the column
COMMENT ON COLUMN strategies.position_side IS 'Direction for futures strategies: long (buy) or short (sell). NULL for spot strategies.';
