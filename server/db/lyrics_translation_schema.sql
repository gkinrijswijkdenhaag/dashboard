-- Create lyrics translation tables
-- Note: The approval functionality is not used in the current implementation.
-- The database schema still includes approval-related fields for future flexibility.

-- Create lyrics_originals table for storing original song lyrics
CREATE TABLE IF NOT EXISTS lyrics_originals (
  id SERIAL PRIMARY KEY,
  service_assignment_id INTEGER REFERENCES service_assignments(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  lyrics TEXT NOT NULL,
  submitted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending', -- Status: 'pending', 'in_translation', 'translated' (approval functionality not used)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create lyrics_translations table for storing translations
CREATE TABLE IF NOT EXISTS lyrics_translations (
  id SERIAL PRIMARY KEY,
  original_id INTEGER NOT NULL REFERENCES lyrics_originals(id) ON DELETE CASCADE,
  translated_title VARCHAR(255),
  translated_lyrics TEXT,
  translated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending', -- Status: 'pending', 'in_progress', 'completed' (approval functionality not used)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(original_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lyrics_originals_service_id ON lyrics_originals(service_assignment_id);
CREATE INDEX IF NOT EXISTS idx_lyrics_originals_status ON lyrics_originals(status);
CREATE INDEX IF NOT EXISTS idx_lyrics_translations_original_id ON lyrics_translations(original_id);
CREATE INDEX IF NOT EXISTS idx_lyrics_translations_status ON lyrics_translations(status);

-- Create function to update the updated_at timestamp for lyrics_originals
CREATE OR REPLACE FUNCTION update_lyrics_originals_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for lyrics_originals
DROP TRIGGER IF EXISTS update_lyrics_originals_updated_at ON lyrics_originals;
CREATE TRIGGER update_lyrics_originals_updated_at
BEFORE UPDATE ON lyrics_originals
FOR EACH ROW EXECUTE FUNCTION update_lyrics_originals_timestamp();

-- Create function to update the updated_at timestamp for lyrics_translations
CREATE OR REPLACE FUNCTION update_lyrics_translations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for lyrics_translations
DROP TRIGGER IF EXISTS update_lyrics_translations_updated_at ON lyrics_translations;
CREATE TRIGGER update_lyrics_translations_updated_at
BEFORE UPDATE ON lyrics_translations
FOR EACH ROW EXECUTE FUNCTION update_lyrics_translations_timestamp();
