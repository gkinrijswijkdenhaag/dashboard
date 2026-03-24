const fs = require("fs");
const path = require("path");
const db = require("../config/db");
const bcrypt = require("bcrypt");
const config = require("../config/config");
const { migrateEmailHistory } = require("./migrate_email_history");
const {
  addServiceDateAndRecipientTypeToEmailHistory,
} = require("./migrate_email_history_fields");
const { optimizeChatQueries } = require("./optimize_chat");
const {
  migrateAssignablePeopleRoles,
} = require("./migrate_assignable_people_roles");
const { migrateHashPasscodes } = require("./migrate_hash_passcodes");
const { migrateEmailEncryption } = require("../controllers/emailSettingsController");

async function initializeDatabase() {
  const client = await db.getClient();

  try {
    console.log("Initializing database...");

    // Read schema SQL files
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, "schema.sql"),
      "utf8"
    );
    const passcodesSchemaSQL = fs.readFileSync(
      path.join(__dirname, "passcodes_schema.sql"),
      "utf8"
    );
    const assignmentsSchemaSQL = fs.readFileSync(
      path.join(__dirname, "assignments_schema.sql"),
      "utf8"
    );
    const workflowSchemaSQL = fs.readFileSync(
      path.join(__dirname, "workflow_schema.sql"),
      "utf8"
    );
    const lyricsTranslationSchemaSQL = fs.readFileSync(
      path.join(__dirname, "lyrics_translation_schema.sql"),
      "utf8"
    );
    const sermonTranslationsSchemaSQL = fs.readFileSync(
      path.join(__dirname, "sermon_translations_schema.sql"),
      "utf8"
    );
    const musicLinksSchemaSQL = fs.readFileSync(
      path.join(__dirname, "music_links_schema.sql"),
      "utf8"
    );
    const activitySchemaSQL = fs.readFileSync(
      path.join(__dirname, "activity_schema.sql"),
      "utf8"
    );
    const emailHistorySchemaSQL = fs.readFileSync(
      path.join(__dirname, "email_history_schema.sql"),
      "utf8"
    );
    const emailSettingsSchemaSQL = fs.readFileSync(
      path.join(__dirname, "email_settings_schema.sql"),
      "utf8"
    );
    const assignablePeopleSchemaSQL = fs.readFileSync(
      path.join(__dirname, "assignable_people_schema.sql"),
      "utf8"
    );
    const roleEmailsSchemaSQL = fs.readFileSync(
      path.join(__dirname, "role_emails_schema.sql"),
      "utf8"
    );

    // Execute schema SQL with logging using the same client
    console.log("Creating base schema...");
    await client.query(schemaSQL);
    console.log("✓ Base schema created");

    console.log("Creating passcodes schema...");
    await client.query(passcodesSchemaSQL);
    console.log("✓ Passcodes schema created");

    console.log("Creating assignments schema...");
    await client.query(assignmentsSchemaSQL);
    console.log("✓ Assignments schema created");

    console.log("Creating workflow schema...");
    await client.query(workflowSchemaSQL);
    console.log("✓ Workflow schema created");

    console.log("Creating lyrics translation schema...");
    await client.query(lyricsTranslationSchemaSQL);
    console.log("✓ Lyrics translation schema created");

    console.log("Creating sermon translations schema...");
    await client.query(sermonTranslationsSchemaSQL);
    console.log("✓ Sermon translations schema created");

    console.log("Creating music links schema...");
    await client.query(musicLinksSchemaSQL);
    console.log("✓ Music links schema created");

    console.log("Creating activity schema...");
    await client.query(activitySchemaSQL);
    console.log("✓ Activity schema created");

    // Add email column to users table if it doesn't exist
    try {
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
      `);
      console.log("Email column added to users table (if not exists)");
    } catch (error) {
      console.warn("Email column migration warning:", error.message);
    }

    // Use migration for email history to handle existing databases
    await migrateEmailHistory();

    // Add new fields to email_history table
    await addServiceDateAndRecipientTypeToEmailHistory();

    // Initialize email settings table
    try {
      await client.query(emailSettingsSchemaSQL);
      console.log("Email settings table initialized successfully");
    } catch (error) {
      console.warn(
        "Email settings table initialization warning:",
        error.message
      );
      // Continue execution as this might be due to existing objects
    }

    // Initialize assignable people table
    try {
      await client.query(assignablePeopleSchemaSQL);
      console.log("Assignable people table initialized successfully");
    } catch (error) {
      console.warn(
        "Assignable people table initialization warning:",
        error.message
      );
      // Continue execution as this might be due to existing objects
    }

    // Migrate assignable people to add roles column
    try {
      await migrateAssignablePeopleRoles();
      console.log("Assignable people roles migration completed successfully");
    } catch (error) {
      console.warn("Assignable people roles migration warning:", error.message);
      // Continue execution as this might be due to existing objects
    }

    // Initialize role emails table
    try {
      await client.query(roleEmailsSchemaSQL);
      console.log("Role emails table initialized successfully");
    } catch (error) {
      console.warn("Role emails table initialization warning:", error.message);
      // Continue execution as this might be due to existing objects
    }

    // Optimize chat queries
    try {
      await optimizeChatQueries();
      console.log("Chat queries optimized successfully");
    } catch (error) {
      console.warn("Chat query optimization warning:", error.message);
      // Continue execution as this might be due to existing objects
    }

    // Hash any plain-text passcodes (idempotent migration)
    try {
      await migrateHashPasscodes();
    } catch (error) {
      console.warn("Passcode hashing migration warning:", error.message);
    }

    // Re-encrypt email settings with per-value random salts (idempotent)
    try {
      await migrateEmailEncryption();
    } catch (error) {
      console.warn("Email encryption migration warning:", error.message);
    }

    console.log("Database schema created successfully");

    // Check if role_passcodes table is empty
    const passcodesCount = await client.query(
      "SELECT COUNT(*) FROM role_passcodes"
    );

    // If no passcodes exist, add default passcodes (hashed)
    if (parseInt(passcodesCount.rows[0].count) === 0) {
      console.log("Adding default passcodes to database...");

      const defaultPasscodes = {
        liturgy: "liturgy123",
        pastor: "pastor123",
        translation: "translation123",
        beamer: "beamer123",
        music: "music123",
        treasurer: "treasurer123",
        admin: "admin2025",
      };

      for (const [role, passcode] of Object.entries(defaultPasscodes)) {
        const hashed = await bcrypt.hash(passcode, 12);
        await client.query(
          "INSERT INTO role_passcodes (role, passcode) VALUES ($1, $2)",
          [role, hashed]
        );
        console.log(`Added default passcode for role: ${role}`);
      }

      console.log("Default passcodes added");
    }

    // Check if users table is empty
    const userCount = await client.query("SELECT COUNT(*) FROM users");

    // If no users exist, create default users for each role
    if (parseInt(userCount.rows[0].count) === 0) {
      console.log("Creating default users...");

      // Get roles from database
      const roleResults = await client.query("SELECT role FROM role_passcodes");
      const roles = [
        { id: "liturgy", name: "Liturgy Maker" },
        { id: "pastor", name: "Pastor" },
        { id: "translation", name: "Translator" },
        { id: "beamer", name: "Beamer Team" },
        { id: "music", name: "Musicians" },
        { id: "treasurer", name: "Treasurer" },
      ];

      for (const role of roles) {
        await client.query(
          "INSERT INTO users (username, role, avatar_url) VALUES ($1, $2, $3)",
          [
            `Default ${role.name}`,
            role.id,
            `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
          ]
        );
      }

      console.log("Default users created successfully");
    }

    console.log("Database initialization completed");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Export the function to be called from server.js
module.exports = { initializeDatabase };

// If this script is run directly, execute the initialization
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log("Database initialization script completed");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Database initialization failed:", err);
      process.exit(1);
    });
}
