-- Create workflow tables if they don't exist (without dropping existing data)

-- Create workflow_tasks table for storing task statuses for each service
CREATE TABLE IF NOT EXISTS workflow_tasks (
  id SERIAL PRIMARY KEY,
  service_assignment_id INTEGER NOT NULL REFERENCES service_assignments(id) ON DELETE CASCADE,
  task_id VARCHAR(50) NOT NULL, -- Identifier for the task (e.g., 'concept', 'sermon', 'qrcode')
  status VARCHAR(20) DEFAULT 'pending', -- Status: 'pending', 'in-progress', 'completed', 'skipped'
  document_link TEXT, -- Optional link to the document
  assigned_to VARCHAR(50), -- Role assigned to this task
  completed_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- User who completed the task
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(service_assignment_id, task_id) -- Ensure unique task per service
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_service_id ON workflow_tasks(service_assignment_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_task_id ON workflow_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_status ON workflow_tasks(status);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_workflow_tasks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists, then create a new one
DROP TRIGGER IF EXISTS update_workflow_tasks_updated_at ON workflow_tasks;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_workflow_tasks_updated_at
BEFORE UPDATE ON workflow_tasks
FOR EACH ROW EXECUTE FUNCTION update_workflow_tasks_timestamp();
