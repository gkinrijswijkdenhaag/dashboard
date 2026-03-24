const db = require("../config/db");

async function addServiceDateAndRecipientTypeToEmailHistory() {
  try {
    console.log("Adding service_date and recipient_type columns to email_history table...");

    // Check if the columns already exist
    const checkColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'email_history' 
      AND column_name IN ('service_date', 'recipient_type');
    `;

    const existingColumns = await db.query(checkColumnsQuery);
    const columnNames = existingColumns.rows.map(row => row.column_name);
    
    // Add service_date column if it doesn't exist
    if (!columnNames.includes('service_date')) {
      console.log("Adding service_date column...");
      await db.query(`
        ALTER TABLE email_history 
        ADD COLUMN service_date VARCHAR(20);
      `);
      
      // Add index for service_date
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_email_history_service_date 
        ON email_history(service_date);
      `);
    } else {
      console.log("service_date column already exists.");
    }

    // Add recipient_type column if it doesn't exist
    if (!columnNames.includes('recipient_type')) {
      console.log("Adding recipient_type column...");
      await db.query(`
        ALTER TABLE email_history 
        ADD COLUMN recipient_type VARCHAR(50);
      `);
      
      // Add index for recipient_type
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_email_history_recipient_type 
        ON email_history(recipient_type);
      `);
    } else {
      console.log("recipient_type column already exists.");
    }

    // Add composite index if both columns exist
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_email_history_service_doc_recipient 
      ON email_history(service_date, document_type, recipient_type);
    `);

    // Update existing records with best-guess recipient_type based on subject/email patterns
    if (!columnNames.includes('recipient_type')) {
      console.log("Updating existing records with recipient_type...");
      
      await db.query(`
        UPDATE email_history 
        SET recipient_type = 'pastor'
        WHERE recipient_type IS NULL 
        AND (
          subject ILIKE '%for review%' 
          OR subject ILIKE '%pastor%'
          OR to_email ILIKE '%pastor%'
        );
      `);

      await db.query(`
        UPDATE email_history 
        SET recipient_type = 'music'
        WHERE recipient_type IS NULL 
        AND (
          subject ILIKE '%music team%' 
          OR subject ILIKE '%music%'
          OR to_email ILIKE '%music%'
        );
      `);
    }

    console.log("Email history migration completed successfully!");

  } catch (error) {
    console.error("Error migrating email_history table:", error);
    throw error;
  }
}

// Export for use in other files
module.exports = { addServiceDateAndRecipientTypeToEmailHistory };

// Run migration if this file is executed directly
if (require.main === module) {
  addServiceDateAndRecipientTypeToEmailHistory()
    .then(() => {
      console.log("Email history migration completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Email history migration failed:", error);
      process.exit(1);
    });
}