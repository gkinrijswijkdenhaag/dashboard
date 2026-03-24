-- Create activity log table for tracking user actions
CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(100), -- Denormalized for display
  user_role VARCHAR(50), -- Denormalized for display
  activity_type VARCHAR(50) NOT NULL, -- 'workflow', 'assignment', etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  details TEXT, -- Additional JSON or text details
  entity_id VARCHAR(100), -- ID of the related entity (task ID, assignment ID, etc.)
  date_string VARCHAR(20), -- Service date if applicable
  icon VARCHAR(50), -- Icon name for display
  color VARCHAR(20), -- Color for display
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_date_string ON activity_log(date_string);
