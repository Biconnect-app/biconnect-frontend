-- Enable RLS on operaciones table (should already be enabled)
ALTER TABLE operaciones ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own operations
CREATE POLICY "Users can view their own operations"
ON operaciones
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own operations (for webhook/API)
CREATE POLICY "Users can insert their own operations"
ON operaciones
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own operations
CREATE POLICY "Users can update their own operations"
ON operaciones
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own operations
CREATE POLICY "Users can delete their own operations"
ON operaciones
FOR DELETE
USING (auth.uid() = user_id);
