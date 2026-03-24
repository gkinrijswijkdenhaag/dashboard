/**
 * PostgreSQL Database Backup Script (Pure JavaScript)
 *
 * This script creates a complete backup using the pg Node.js library
 * No need for pg_dump or PostgreSQL client tools!
 *
 * Usage: node backup-database-js.js
 * Output: Creates a backup file in the backups folder with timestamp
 */

import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../server/.env") });

const { Client } = pg;

// Parse DATABASE_URL
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL not found in environment variables");
  process.exit(1);
}

// Create backups directory if it doesn't exist
const backupsDir = path.join(__dirname, "backups");
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// Generate backup filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
const backupFile = path.join(backupsDir, `backup-${timestamp}.sql`);

console.log("🔄 Starting PostgreSQL Database Backup...");
console.log("━".repeat(50));
console.log(`📁 Backup file: ${backupFile}`);
console.log("━".repeat(50));

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

let sqlOutput = [];

const addSQL = (line) => {
  sqlOutput.push(line);
};

const escapeString = (str) => {
  if (str === null || str === undefined) return "NULL";
  if (typeof str === "number" || typeof str === "boolean") return str;
  return "'" + String(str).replace(/'/g, "''").replace(/\\/g, "\\\\") + "'";
};

const backupDatabase = async () => {
  try {
    await client.connect();
    console.log("✅ Connected to database\n");

    addSQL("-- PostgreSQL Database Backup");
    addSQL(`-- Generated: ${new Date().toISOString()}`);
    addSQL(`-- Database: ${client.database}`);
    addSQL("");

    // Get all tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tables = tablesResult.rows.map((row) => row.table_name);

    if (tables.length === 0) {
      console.log("⚠️  No tables found in database");
      addSQL("-- No tables found");
    } else {
      console.log(`📊 Found ${tables.length} tables\n`);

      for (const tableName of tables) {
        console.log(`🔄 Backing up table: ${tableName}`);

        addSQL(`\n-- Table: ${tableName}`);
        addSQL(`DROP TABLE IF EXISTS ${tableName} CASCADE;`);

        // Get table schema
        const schemaResult = await client.query(
          `
          SELECT 
            column_name,
            data_type,
            character_maximum_length,
            column_default,
            is_nullable,
            numeric_precision,
            numeric_scale
          FROM information_schema.columns
          WHERE table_name = $1
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `,
          [tableName]
        );

        // Create table statement
        const columns = schemaResult.rows.map((col) => {
          let colDef = `  ${col.column_name} `;

          // Data type
          if (col.data_type === "character varying") {
            colDef += col.character_maximum_length
              ? `VARCHAR(${col.character_maximum_length})`
              : "VARCHAR";
          } else if (col.data_type === "numeric" && col.numeric_precision) {
            colDef += `NUMERIC(${col.numeric_precision},${
              col.numeric_scale || 0
            })`;
          } else {
            colDef += col.data_type.toUpperCase();
          }

          // Nullable
          if (col.is_nullable === "NO") {
            colDef += " NOT NULL";
          }

          // Default
          if (col.column_default) {
            colDef += ` DEFAULT ${col.column_default}`;
          }

          return colDef;
        });

        addSQL(`CREATE TABLE ${tableName} (`);
        addSQL(columns.join(",\n"));
        addSQL(");");

        // Get primary keys
        const pkResult = await client.query(
          `
          SELECT a.attname
          FROM pg_index i
          JOIN pg_attribute a ON a.attrelid = i.indrelid
            AND a.attnum = ANY(i.indkey)
          WHERE i.indrelid = $1::regclass
          AND i.indisprimary;
        `,
          [tableName]
        );

        if (pkResult.rows.length > 0) {
          const pkColumns = pkResult.rows.map((r) => r.attname).join(", ");
          addSQL(`ALTER TABLE ${tableName} ADD PRIMARY KEY (${pkColumns});`);
        }

        // Get data
        const dataResult = await client.query(`SELECT * FROM ${tableName}`);

        if (dataResult.rows.length > 0) {
          console.log(`   ✓ ${dataResult.rows.length} rows`);

          const columnNames = schemaResult.rows.map((col) => col.column_name);

          for (const row of dataResult.rows) {
            const values = columnNames
              .map((col) => escapeString(row[col]))
              .join(", ");
            addSQL(
              `INSERT INTO ${tableName} (${columnNames.join(
                ", "
              )}) VALUES (${values});`
            );
          }
        } else {
          console.log("   ✓ 0 rows (empty table)");
        }

        addSQL("");
      }

      // Get foreign keys
      console.log("\n🔗 Backing up foreign keys...");
      const fkResult = await client.query(`
        SELECT
          tc.table_name,
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public';
      `);

      if (fkResult.rows.length > 0) {
        addSQL("\n-- Foreign Keys");
        for (const fk of fkResult.rows) {
          addSQL(
            `ALTER TABLE ${fk.table_name} ADD CONSTRAINT ${fk.constraint_name} ` +
              `FOREIGN KEY (${fk.column_name}) REFERENCES ${fk.foreign_table_name}(${fk.foreign_column_name});`
          );
        }
        console.log(`   ✓ ${fkResult.rows.length} foreign keys`);
      }

      // Get indexes (excluding primary keys)
      console.log("\n📑 Backing up indexes...");
      const indexResult = await client.query(`
        SELECT
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname NOT LIKE '%_pkey';
      `);

      if (indexResult.rows.length > 0) {
        addSQL("\n-- Indexes");
        for (const idx of indexResult.rows) {
          addSQL(`${idx.indexdef};`);
        }
        console.log(`   ✓ ${indexResult.rows.length} indexes`);
      }

      // Get sequences
      console.log("\n🔢 Backing up sequences...");
      const seqResult = await client.query(`
        SELECT sequence_name
        FROM information_schema.sequences
        WHERE sequence_schema = 'public';
      `);

      if (seqResult.rows.length > 0) {
        addSQL("\n-- Sequences");
        for (const seq of seqResult.rows) {
          const valResult = await client.query(
            `SELECT last_value FROM ${seq.sequence_name}`
          );
          addSQL(
            `SELECT setval('${seq.sequence_name}', ${valResult.rows[0].last_value}, true);`
          );
        }
        console.log(`   ✓ ${seqResult.rows.length} sequences`);
      }
    }

    // Write to file
    fs.writeFileSync(backupFile, sqlOutput.join("\n"), "utf8");

    const stats = fs.statSync(backupFile);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log("\n" + "━".repeat(50));
    console.log("✅ Backup completed successfully!");
    console.log("━".repeat(50));
    console.log(`📁 File: ${backupFile}`);
    console.log(`📦 Size: ${fileSizeInMB} MB`);
    console.log(`⏰ Date: ${new Date().toLocaleString()}`);
    console.log("━".repeat(50));
    console.log(
      "\n💡 To restore this backup, use: node restore-database-js.js"
    );
  } catch (error) {
    console.error("\n❌ Backup failed!");
    console.error("Error:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
};

backupDatabase();
