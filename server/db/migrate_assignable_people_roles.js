const db = require("../config/db");

/**
 * Migration to add roles column to assignable_people table
 */
async function migrateAssignablePeopleRoles() {
  const client = await db.getClient();

  try {
    await client.query("BEGIN");

    // Check if roles column exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'assignable_people' 
      AND column_name = 'roles'
    `);

    if (checkColumn.rows.length === 0) {
      console.log("Adding roles column to assignable_people table...");

      // Add roles column
      await client.query(`
        ALTER TABLE assignable_people 
        ADD COLUMN roles TEXT[] DEFAULT '{}'
      `);

      // Create GIN index for roles array
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_assignable_people_roles 
        ON assignable_people USING GIN(roles)
      `);

      console.log("Successfully added roles column and index");
    } else {
      console.log("Roles column already exists, skipping migration");
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error migrating assignable_people roles:", error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { migrateAssignablePeopleRoles };
