-- Role Emails Schema
-- Store email addresses for each role (admin-managed)
CREATE TABLE IF NOT EXISTS role_emails (
  id SERIAL PRIMARY KEY,
  role VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES users(id)
);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_role_emails_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_role_emails_timestamp ON role_emails;
CREATE TRIGGER trigger_update_role_emails_timestamp
    BEFORE UPDATE ON role_emails
    FOR EACH ROW
    EXECUTE FUNCTION update_role_emails_timestamp();

-- Insert default role emails (empty by default, admin will set them)
INSERT INTO role_emails (role, email) VALUES
  ('liturgy', ''),
  ('pastor', ''),
  ('translation', ''),
  ('beamer', ''),
  ('music', ''),
  ('treasurer', ''),
  ('admin', '')
ON CONFLICT (role) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE role_emails IS 'Stores email addresses for each role, managed by admin';
COMMENT ON COLUMN role_emails.role IS 'The role name (e.g., liturgy, pastor, music)';
COMMENT ON COLUMN role_emails.email IS 'Email address for this role (all users in this role share this email)';
COMMENT ON COLUMN role_emails.updated_by IS 'ID of the admin user who last updated this email';

