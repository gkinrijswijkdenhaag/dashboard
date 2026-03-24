-- Create assignments tables if they don't exist (without dropping existing data)

-- Create assignments table for storing service assignments
CREATE TABLE IF NOT EXISTS service_assignments (
  id SERIAL PRIMARY KEY,
  date_string VARCHAR(10) NOT NULL UNIQUE, -- Format: YYYY-MM-DD, unique constraint for UPSERT
  title VARCHAR(100) DEFAULT 'Sunday Service',
  status VARCHAR(20) DEFAULT 'upcoming',
  days_until INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create assignment_roles table for storing individual role assignments
CREATE TABLE IF NOT EXISTS assignment_roles (
  id SERIAL PRIMARY KEY,
  service_assignment_id INTEGER NOT NULL REFERENCES service_assignments(id) ON DELETE CASCADE,
  role VARCHAR(100) NOT NULL,
  person VARCHAR(100) DEFAULT '',
  role_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_assignments_date ON service_assignments(date_string);
CREATE INDEX IF NOT EXISTS idx_assignment_roles_service_id ON assignment_roles(service_assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_roles_person ON assignment_roles(person);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist, then create new ones
DROP TRIGGER IF EXISTS update_service_assignments_updated_at ON service_assignments;
DROP TRIGGER IF EXISTS update_assignment_roles_updated_at ON assignment_roles;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_service_assignments_updated_at 
    BEFORE UPDATE ON service_assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignment_roles_updated_at 
    BEFORE UPDATE ON assignment_roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();