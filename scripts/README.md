# Database Backup & Restore Scripts (Pure JavaScript)

Complete PostgreSQL backup and restore using **pure Node.js** - no PostgreSQL client tools required! ✨

## ✅ Prerequisites

**Nothing to install!** These scripts use the `pg` and `dotenv` packages which are already installed in your project.

Works with:

- ✅ Remote databases (Render, AWS RDS, Heroku, etc.)
- ✅ Local databases
- ✅ Windows, macOS, and Linux
- ✅ Any PostgreSQL version

---

## 📦 What Gets Backed Up?

The backup includes **EVERYTHING**:

✅ **All Tables** - Complete structure and definitions  
✅ **All Data** - Every single row from every table  
✅ **All Columns** - With data types, lengths, precision  
✅ **Primary Keys** - All primary key constraints  
✅ **Foreign Keys** - All relationships between tables  
✅ **Indexes** - All indexes for query performance  
✅ **Sequences** - Auto-increment counters with current values  
✅ **Constraints** - NOT NULL, DEFAULT, UNIQUE, etc.  
✅ **Empty Tables** - Structure preserved even with no data

This is a **complete clone** of your database!

---

## 🚀 Quick Start

### Create a Backup

```bash
cd scripts
node backup-database-js.js
```

**Output:**

```
🔄 Starting PostgreSQL Database Backup...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 Backup file: F:\Projects\gkin\scripts\backups\backup-2025-11-22T15-49-18.sql
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Connected to database

📊 Found 15 tables
🔄 Backing up table: users
   ✓ 11 rows
...
🔗 Backing up foreign keys...
   ✓ 19 foreign keys
📑 Backing up indexes...
   ✓ 37 indexes
🔢 Backing up sequences...
   ✓ 15 sequences

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Backup completed successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 File: F:\Projects\gkin\scripts\backups\backup-2025-11-22T15-49-18.sql
📦 Size: 0.04 MB
⏰ Date: 11/22/2025, 11:49:24 PM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Restore a Backup

#### Option 1: Restore latest backup to current database

```bash
cd scripts
node restore-database-js.js
```

#### Option 2: Restore specific backup

```bash
node restore-database-js.js backups/backup-2025-11-22T15-49-18.sql
```

#### Option 3: Restore to a DIFFERENT database

```bash
node restore-database-js.js backups/backup-2025-11-22T15-49-18.sql postgresql://user:pass@newhost:5432/newdb
```

**Safety Feature:**

```
⚠️  WARNING: This will REPLACE ALL DATA in the target database!
   All existing tables, data, and objects will be dropped and recreated.

Are you sure you want to continue? (yes/no):
```

---

## 📖 Detailed Usage

### Backup Script (`backup-database-js.js`)

**What it does:**

1. Reads `DATABASE_URL` from `server/.env`
2. Connects to your PostgreSQL database
3. Exports all tables, data, relationships, indexes, and sequences
4. Creates a timestamped `.sql` file in `backups/` folder

**The backup file contains:**

- DROP TABLE statements (with CASCADE)
- CREATE TABLE statements (with all columns and types)
- INSERT statements (with all data)
- ALTER TABLE statements (for primary keys)
- Foreign key constraints
- Index definitions
- Sequence value setters

### Restore Script (`restore-database-js.js`)

**What it does:**

1. Finds the latest backup (or uses specified file)
2. Connects to target database
3. Drops existing tables
4. Recreates all tables
5. Inserts all data
6. Restores all relationships and indexes

**Command line options:**

```bash
# Use latest backup + current DATABASE_URL from .env
node restore-database-js.js

# Use specific backup + current DATABASE_URL
node restore-database-js.js backups/backup-2025-11-22.sql

# Use specific backup + custom database URL
node restore-database-js.js backups/backup-2025-11-22.sql postgresql://user:pass@host/db
```

---

## 🔄 Migration Workflow

### Moving to a New PostgreSQL Server

**Step 1: Backup your current database**

```bash
cd F:\Projects\gkin\scripts
node backup-database-js.js
```

**Step 2: Set up new database**

- Create a new empty PostgreSQL database
- Get the connection URL: `postgresql://user:pass@host:port/database`

**Step 3: Restore to new database**

```bash
node restore-database-js.js backups/backup-2025-11-22T15-49-18.sql postgresql://newuser:newpass@newhost:5432/newdb
```

**Step 4: Update your environment**

- Update `DATABASE_URL` in `server/.env`
- Restart your application
- Test everything works

**Step 5: Verify**

- Check all tables exist
- Verify data looks correct
- Test application features

✨ **Done!** Your database has been migrated successfully!

---

## 🤖 Automation

### Schedule Regular Backups

#### Windows (Task Scheduler)

Create `backup.bat`:

```batch
@echo off
cd /d F:\Projects\gkin\scripts
node backup-database-js.js
```

Then add to Task Scheduler:

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., Daily at 2 AM)
4. Action: Start a program
5. Program: `F:\Projects\gkin\scripts\backup.bat`

#### macOS/Linux (cron)

```bash
crontab -e
```

Add:

```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/gkin/scripts && node backup-database-js.js
```

---

## 🔒 Security & Storage

### Best Practices

**❌ Never commit backups to git**

- The `.gitignore` is already configured to exclude `backups/`
- Backup files contain sensitive data

**✅ Store backups securely**

- Keep backups in a secure location
- Consider encrypting large/sensitive backups
- Use cloud storage with encryption (Google Drive, Dropbox, S3)

**💾 Compress large backups**

```bash
# Compress
gzip backups/backup-2025-11-22.sql

# Creates: backup-2025-11-22.sql.gz (much smaller!)

# Decompress when needed
gunzip backups/backup-2025-11-22.sql.gz
```

**🔄 Regular backup schedule**

- Daily for production databases
- Before major updates
- Before schema changes
- Before data migrations

---

## 🐛 Troubleshooting

### Connection Issues

**Problem:** `Connection timeout` or `Connection refused`

**Solutions:**

- Verify `DATABASE_URL` is correct in `server/.env`
- Check if database server is accessible
- Verify firewall allows connections
- For remote databases (Render, etc.), check if IP is whitelisted

### Permission Errors

**Problem:** `Permission denied` errors

**Solutions:**

- Ensure database user has SELECT permission (for backup)
- Ensure database user has CREATE, DROP, INSERT permissions (for restore)
- Contact database admin if you don't have permissions

### Large Database Issues

**Problem:** Script hangs or takes too long

**Solutions:**

- Large databases (100MB+) may take several minutes - this is normal
- The script shows progress as it works
- For very large databases (1GB+), consider using incremental backups

### "Module not found" Error

**Problem:** `Cannot find module 'pg'` or `Cannot find module 'dotenv'`

**Solution:**

```bash
# From project root
npm install pg dotenv
```

---

## 📊 Backup File Format

The backup file is a plain SQL text file that you can:

- ✅ View in any text editor
- ✅ Edit manually if needed
- ✅ Version control (for schema only, not data)
- ✅ Share with team members
- ✅ Compress with gzip/zip

**Example structure:**

```sql
-- PostgreSQL Database Backup
-- Generated: 2025-11-22T15:49:19.522Z

-- Table: users
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id INTEGER NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  email VARCHAR(255) NOT NULL,
  ...
);
ALTER TABLE users ADD PRIMARY KEY (id);
INSERT INTO users (id, email, ...) VALUES (1, 'user@example.com', ...);
...

-- Foreign Keys
ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES users(id);
...

-- Indexes
CREATE INDEX idx_users_email ON public.users USING btree (email);
...

-- Sequences
SELECT setval('users_id_seq', 11, true);
```

---

## ❓ FAQ

**Q: Do I need PostgreSQL installed on my computer?**  
A: No! The scripts use the `pg` Node.js package, no PostgreSQL client tools needed.

**Q: Can I restore to a different PostgreSQL version?**  
A: Yes! The SQL generated is compatible across PostgreSQL versions.

**Q: Will this work with my Render.com database?**  
A: Yes! It works with any PostgreSQL database (local or remote).

**Q: What if I have a very large database?**  
A: The scripts handle databases of any size. Large databases just take longer to backup/restore.

**Q: Can I use this for production?**  
A: Yes! These scripts are production-ready and safe to use.

**Q: Does it backup stored procedures and triggers?**  
A: The current version backs up tables, data, constraints, indexes, and sequences. Custom functions and triggers are not yet included but can be added if needed.

---

## 🎯 Summary

**To Backup:**

```bash
cd scripts
node backup-database-js.js
```

**To Restore:**

```bash
cd scripts
node restore-database-js.js
```

**To Migrate to New Database:**

```bash
node restore-database-js.js backups/backup-YYYY-MM-DD.sql postgresql://newurl
```

That's it! Simple, powerful, and no external tools required. 🚀

---

**Need help?** Check the troubleshooting section or examine the backup file directly - it's plain SQL you can read and understand!
