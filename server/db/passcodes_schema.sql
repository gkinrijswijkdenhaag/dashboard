-- Create role_passcodes table to store role-based authentication passcodes
CREATE TABLE IF NOT EXISTS role_passcodes (
  id SERIAL PRIMARY KEY,
  role VARCHAR(50) UNIQUE NOT NULL,
  passcode VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create function to update the timestamp when a passcode is updated
CREATE OR REPLACE FUNCTION update_role_passcode_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the timestamp
DROP TRIGGER IF EXISTS trigger_update_role_passcode_timestamp ON role_passcodes;
CREATE TRIGGER trigger_update_role_passcode_timestamp
BEFORE UPDATE ON role_passcodes
FOR EACH ROW EXECUTE FUNCTION update_role_passcode_timestamp();
