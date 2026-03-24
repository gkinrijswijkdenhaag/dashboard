-- Add index for optimized chat message queries
CREATE INDEX IF NOT EXISTS idx_messages_created_at_desc ON messages(created_at DESC);

-- Note: We already have idx_messages_created_at, but adding a specific DESC index
-- will help optimize the query that orders by created_at DESC
