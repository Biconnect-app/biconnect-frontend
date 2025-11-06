-- Make api_key and api_secret nullable in exchanges table
-- This allows users to create placeholder exchanges without API keys
-- and add them later

ALTER TABLE exchanges 
ALTER COLUMN api_key DROP NOT NULL,
ALTER COLUMN api_secret DROP NOT NULL;

-- Add a comment to document this change
COMMENT ON COLUMN exchanges.api_key IS 'API key for the exchange (optional, can be added later)';
COMMENT ON COLUMN exchanges.api_secret IS 'API secret for the exchange (optional, can be added later)';
