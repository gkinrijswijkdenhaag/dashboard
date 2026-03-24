-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  avatar_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table for chat
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- We'll store mentions as a JSON array in the database
  mentions JSONB DEFAULT '[]'
);

-- Create message_mentions for efficient querying
CREATE TABLE IF NOT EXISTS message_mentions (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  mentioned_role VARCHAR(50),
  mentioned_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster querying
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_message_mentions_role ON message_mentions(mentioned_role);
CREATE INDEX IF NOT EXISTS idx_message_mentions_user ON message_mentions(mentioned_user_id);

-- Create function to automatically create mentions
CREATE OR REPLACE FUNCTION create_message_mentions() RETURNS TRIGGER AS $$
BEGIN
  -- For each mention in the mentions array
  IF NEW.mentions IS NOT NULL AND jsonb_array_length(NEW.mentions) > 0 THEN
    FOR i IN 0..jsonb_array_length(NEW.mentions)-1 LOOP
      -- Check if it's a role mention
      IF jsonb_typeof(NEW.mentions->i->'type') = 'string' AND (NEW.mentions->i->>'type') = 'role' THEN
        INSERT INTO message_mentions (message_id, mentioned_role, created_at)
        VALUES (NEW.id, (NEW.mentions->i->>'value'), NEW.created_at);
      -- Or a user mention
      ELSIF jsonb_typeof(NEW.mentions->i->'type') = 'string' AND (NEW.mentions->i->>'type') = 'user' THEN
        INSERT INTO message_mentions (message_id, mentioned_user_id, created_at)
        VALUES (NEW.id, (NEW.mentions->i->>'value')::integer, NEW.created_at);
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create mentions
DROP TRIGGER IF EXISTS trigger_create_message_mentions ON messages;
CREATE TRIGGER trigger_create_message_mentions
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION create_message_mentions();
