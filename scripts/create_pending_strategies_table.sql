-- Create pending_strategies table to store preview data before email confirmation
CREATE TABLE IF NOT EXISTS pending_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  strategy_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_pending_strategies_email ON pending_strategies(email);

-- Add RLS policies
ALTER TABLE pending_strategies ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for registration flow before email confirmation)
CREATE POLICY "Anyone can insert pending strategies"
  ON pending_strategies
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to read (needed for registration and login flow)
CREATE POLICY "Anyone can read pending strategies"
  ON pending_strategies
  FOR SELECT
  USING (true);

-- Allow anyone to update their pending strategies (for upsert during registration)
CREATE POLICY "Anyone can update pending strategies"
  ON pending_strategies
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anyone to delete pending strategies (cleanup after successful login)
CREATE POLICY "Anyone can delete pending strategies"
  ON pending_strategies
  FOR DELETE
  USING (true);
