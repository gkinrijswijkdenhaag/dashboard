-- Email Settings Schema
-- Store system email configuration
CREATE TABLE IF NOT EXISTS email_settings (
  id SERIAL PRIMARY KEY,
  setting_name VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  is_encrypted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES users(id)
);

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS update_email_settings_updated_at_trigger ON email_settings;
DROP FUNCTION IF EXISTS update_email_settings_updated_at();

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_email_settings_updated_at_trigger
    BEFORE UPDATE ON email_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_email_settings_updated_at();

-- Insert default SMTP settings (using current hardcoded values as defaults)
INSERT INTO email_settings (setting_name, setting_value, is_encrypted) VALUES
  ('smtp_host', 'smtp.privateemail.com', false),
  ('smtp_port', '465', false),
  ('smtp_secure', 'true', false),
  ('smtp_user', 'user2003@andrewscreem.com', false),
  ('smtp_password', '$DANdan2003$', false),
  ('from_name', 'GKIN System', false),
  ('from_email', 'user2003@andrewscreem.com', false)
ON CONFLICT (setting_name) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE email_settings IS 'Stores system email/SMTP configuration settings';
COMMENT ON COLUMN email_settings.setting_name IS 'Name of the email setting (e.g., smtp_host, smtp_port)';
COMMENT ON COLUMN email_settings.setting_value IS 'Value of the setting (encrypted if is_encrypted=true)';
COMMENT ON COLUMN email_settings.is_encrypted IS 'Whether the setting value is encrypted (for passwords)';
COMMENT ON COLUMN email_settings.updated_by IS 'ID of the admin user who last updated this setting';