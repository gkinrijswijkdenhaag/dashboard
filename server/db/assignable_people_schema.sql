-- Create assignable_people table for storing people who can be assigned to service roles
CREATE TABLE IF NOT EXISTS assignable_people (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  roles TEXT[] DEFAULT '{}', -- Array of roles this person can fill
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_assignable_people_name ON assignable_people(name);
CREATE INDEX IF NOT EXISTS idx_assignable_people_email ON assignable_people(email);
CREATE INDEX IF NOT EXISTS idx_assignable_people_active ON assignable_people(is_active);
CREATE INDEX IF NOT EXISTS idx_assignable_people_roles ON assignable_people USING GIN(roles);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_assignable_people_updated_at ON assignable_people;

CREATE TRIGGER update_assignable_people_updated_at 
    BEFORE UPDATE ON assignable_people 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

