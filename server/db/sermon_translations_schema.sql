-- Create sermon translations tables
-- This schema follows a similar pattern to the lyrics_translations schema

-- Create sermon_originals table for storing original sermons
CREATE TABLE IF NOT EXISTS sermon_originals (
  id SERIAL PRIMARY KEY,
  service_assignment_id INTEGER REFERENCES service_assignments(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  document_link TEXT NOT NULL,
  submitted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending', -- Status: 'pending', 'in_translation', 'translated'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create sermon_translations table for storing translations
CREATE TABLE IF NOT EXISTS sermon_translations (
  id SERIAL PRIMARY KEY,
  original_id INTEGER NOT NULL REFERENCES sermon_originals(id) ON DELETE CASCADE,
  translated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  translated_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'pending', -- Status: 'pending', 'in_progress', 'completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(original_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sermon_originals_service_id ON sermon_originals(service_assignment_id);
CREATE INDEX IF NOT EXISTS idx_sermon_originals_status ON sermon_originals(status);
CREATE INDEX IF NOT EXISTS idx_sermon_translations_original_id ON sermon_translations(original_id);
CREATE INDEX IF NOT EXISTS idx_sermon_translations_status ON sermon_translations(status);

-- Create function to update the updated_at timestamp for sermon_originals
CREATE OR REPLACE FUNCTION update_sermon_originals_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for sermon_originals
DROP TRIGGER IF EXISTS update_sermon_originals_updated_at ON sermon_originals;
CREATE TRIGGER update_sermon_originals_updated_at
BEFORE UPDATE ON sermon_originals
FOR EACH ROW EXECUTE FUNCTION update_sermon_originals_timestamp();

-- Create function to update the updated_at timestamp for sermon_translations
CREATE OR REPLACE FUNCTION update_sermon_translations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for sermon_translations
DROP TRIGGER IF EXISTS update_sermon_translations_updated_at ON sermon_translations;
CREATE TRIGGER update_sermon_translations_updated_at
BEFORE UPDATE ON sermon_translations
FOR EACH ROW EXECUTE FUNCTION update_sermon_translations_timestamp();
