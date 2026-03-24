-- Create music_links table for storing multiple music links per task
CREATE TABLE IF NOT EXISTS music_links (
  id SERIAL PRIMARY KEY,
  workflow_task_id INTEGER NOT NULL REFERENCES workflow_tasks(id) ON DELETE CASCADE,
  name VARCHAR(255), -- Name/description of the music link
  url TEXT NOT NULL, -- URL to the music resource
  display_order INTEGER DEFAULT 0, -- Order for display
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_music_links_task_id ON music_links(workflow_task_id);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_music_links_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists, then create a new one
DROP TRIGGER IF EXISTS update_music_links_updated_at ON music_links;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_music_links_updated_at
BEFORE UPDATE ON music_links
FOR EACH ROW EXECUTE FUNCTION update_music_links_timestamp();
