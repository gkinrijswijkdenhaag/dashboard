const db = require('../config/db');
const fs = require('fs');
const path = require('path');

/**
 * Initialize email settings table
 */
async function initEmailSettings() {
  try {
    console.log('Initializing email settings table...');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'email_settings_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute the schema
    await db.query(schema);

    console.log('Email settings table initialized successfully');
  } catch (error) {
    console.error('Error initializing email settings table:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  initEmailSettings()
    .then(() => {
      console.log('Email settings initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Email settings initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initEmailSettings };