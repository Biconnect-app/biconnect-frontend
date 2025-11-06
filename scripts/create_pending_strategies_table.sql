-- Create pending_strategies table to store preview data before email confirmation
CREATE TABLE IF NOT EXISTS pending_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  strategy_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_pending_strategies_email ON pending_strategies(email);

-- Add RLS policies
ALTER TABLE pending_strategies ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for registration flow)
CREATE POLICY "Anyone can insert pending strategies"
  ON pending_strategies
  FOR INSERT
  WITH CHECK (true);

-- Allow users to read their own pending strategies by email
CREATE POLICY "Users can read their own pending strategies"
  ON pending_strategies
  FOR SELECT
  USING (email = auth.jwt() ->> 'email');

-- Allow users to delete their own pending strategies
CREATE POLICY "Users can delete their own pending strategies"
  ON pending_strategies
  FOR DELETE
  USING (email = auth.jwt() ->> 'email');
