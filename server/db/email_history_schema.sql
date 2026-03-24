-- Create email_history table to track all sent emails
CREATE TABLE IF NOT EXISTS email_history (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  sender_role VARCHAR(50) NOT NULL,
  sender_username VARCHAR(100) NOT NULL,
  to_email VARCHAR(255) NOT NULL,
  cc_emails TEXT, -- Store comma-separated CC emails
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  document_type VARCHAR(50), -- e.g., 'concept', 'final', 'sermon'
  recipient_type VARCHAR(50), -- e.g., 'pastor', 'music'
  service_date VARCHAR(20), -- Service date in YYYY-MM-DD format
  document_link TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'failed', 'pending'
  message_id VARCHAR(255), -- SMTP message ID for tracking
  error_message TEXT -- Store error details if sending failed
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_history_sender_id ON email_history(sender_id);
CREATE INDEX IF NOT EXISTS idx_email_history_sender_role ON email_history(sender_role);
CREATE INDEX IF NOT EXISTS idx_email_history_document_type ON email_history(document_type);
CREATE INDEX IF NOT EXISTS idx_email_history_recipient_type ON email_history(recipient_type);
CREATE INDEX IF NOT EXISTS idx_email_history_service_date ON email_history(service_date);
CREATE INDEX IF NOT EXISTS idx_email_history_sent_at ON email_history(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_history_status ON email_history(status);
-- Composite index for the most common query pattern
CREATE INDEX IF NOT EXISTS idx_email_history_service_doc_recipient ON email_history(service_date, document_type, recipient_type);

-- Add a comment to describe the table
COMMENT ON TABLE email_history IS 'Tracks all emails sent through the GKIN system for audit and history purposes';
COMMENT ON COLUMN email_history.sender_id IS 'ID of the user who sent the email (NULL if user deleted)';
COMMENT ON COLUMN email_history.sender_role IS 'Role of the sender at the time of sending';
COMMENT ON COLUMN email_history.sender_username IS 'Username of the sender at the time of sending';
COMMENT ON COLUMN email_history.cc_emails IS 'Comma-separated list of CC email addresses';
COMMENT ON COLUMN email_history.document_type IS 'Type of document being shared (concept, final, sermon, etc.)';
COMMENT ON COLUMN email_history.message_id IS 'SMTP message ID returned by the email service';