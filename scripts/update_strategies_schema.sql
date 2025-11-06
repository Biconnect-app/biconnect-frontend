-- Add exchange_name column to strategies table
ALTER TABLE strategies
ADD COLUMN IF NOT EXISTS exchange_name TEXT;

-- Make exchange_id nullable
ALTER TABLE strategies
ALTER COLUMN exchange_id DROP NOT NULL;

-- Migrate existing data: copy exchange names from exchanges table to strategies
UPDATE strategies s
SET exchange_name = e.exchange_name
FROM exchanges e
WHERE s.exchange_id = e.id
AND s.exchange_name IS NULL;

-- Add comment to explain the columns
COMMENT ON COLUMN strategies.exchange_name IS 'Name of the exchange (e.g., binance, okx) - does not require exchange configuration';
COMMENT ON COLUMN strategies.exchange_id IS 'Optional: Links to a configured exchange in the exchanges table when user wants to activate the strategy';
