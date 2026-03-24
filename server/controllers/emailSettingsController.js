const db = require('../config/db');
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY || 'gkin_email_settings_key_change_in_production';
const ALGORITHM = 'aes-256-cbc';
const SALT_BYTES = 16;
const IV_LENGTH = 16;
const KEY_LENGTH = 32;

// Derive a 32-byte AES key from the master key + a per-ciphertext random salt (secure)
const deriveKey = (masterKey, salt) => crypto.scryptSync(masterKey, salt, KEY_LENGTH);

/**
 * Encrypt plaintext. Stores a fresh random salt alongside the IV so each
 * ciphertext uses a unique key-derivation input.
 * Format: s2:{salt_hex}:{iv_hex}:{ciphertext_hex}
 */
const encrypt = (text) => {
  const salt = crypto.randomBytes(SALT_BYTES);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(ENCRYPTION_KEY, salt);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `s2:${salt.toString('hex')}:${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt a ciphertext produced by encrypt().
 * Supports both the new s2 format and the legacy format (static salt 'salt')
 * so that existing rows can be read and then re-encrypted on the fly.
 */
const decrypt = (encryptedText) => {
  if (!encryptedText) return encryptedText;

  // New format: s2:{salt_hex}:{iv_hex}:{ciphertext_hex}
  if (encryptedText.startsWith('s2:')) {
    const parts = encryptedText.slice(3).split(':');
    if (parts.length < 3) throw new Error('Invalid s2 encrypted format');
    const salt = Buffer.from(parts[0], 'hex');
    const iv = Buffer.from(parts[1], 'hex');
    const ciphertext = parts.slice(2).join(':');
    const key = deriveKey(ENCRYPTION_KEY, salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Legacy format: {iv_hex}:{ciphertext_hex} (scrypt with hardcoded static salt 'salt')
  if (encryptedText.includes(':')) {
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const ciphertext = textParts.join(':');
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', KEY_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  return encryptedText; // unencrypted plain text
};

/**
 * One-time idempotent migration: find all encrypted email settings stored in
 * the legacy format (no s2: prefix) and re-encrypt them with per-value random
 * salts. Safe to run on every startup — already-migrated rows are skipped.
 */
const migrateEmailEncryption = async () => {
  try {
    const result = await db.query(
      'SELECT id, setting_name, setting_value FROM email_settings WHERE is_encrypted = true'
    );
    let migrated = 0;
    for (const row of result.rows) {
      if (!row.setting_value.startsWith('s2:')) {
        const plaintext = decrypt(row.setting_value); // uses legacy path
        const newValue = encrypt(plaintext);            // uses new s2 format
        await db.query(
          'UPDATE email_settings SET setting_value = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [newValue, row.id]
        );
        migrated++;
      }
    }
    if (migrated > 0) {
      console.log(`✓ Re-encrypted ${migrated} email setting(s) with per-value random salts.`);
    } else {
      console.log('Email settings encryption already up to date — nothing to migrate.');
    }
  } catch (error) {
    // Non-fatal: log and continue. The old format still decrypts fine.
    console.warn('Email encryption migration warning:', error.message);
  }
};

/**
 * Email Settings controller for managing SMTP configuration
 */
const emailSettingsController = {
  /**
   * Get all email settings (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getEmailSettings(req, res) {
    try {
      const result = await db.query(`
        SELECT setting_name, setting_value, is_encrypted, updated_at 
        FROM email_settings 
        ORDER BY setting_name
      `);

      // Decrypt encrypted values; always mask password fields regardless of is_encrypted flag
      const settings = result.rows.map(setting => ({
        ...setting,
        setting_value: setting.setting_name.includes('password')
          ? '••••••••'
          : (setting.is_encrypted ? decrypt(setting.setting_value) : setting.setting_value)
      }));

      return res.status(200).json({
        success: true,
        settings
      });
    } catch (error) {
      console.error('Error fetching email settings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch email settings'
      });
    }
  },

  /**
   * Update email settings (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateEmailSettings(req, res) {
    try {
      const { settings } = req.body;
      const userId = req.user.id;

      if (!settings || !Array.isArray(settings)) {
        return res.status(400).json({
          success: false,
          message: 'Settings array is required'
        });
      }

      // Start transaction
      const client = await db.getClient();
      try {
        await client.query('BEGIN');

        for (const setting of settings) {
          const { setting_name, setting_value } = setting;

          if (!setting_name || setting_value === undefined) {
            throw new Error('setting_name and setting_value are required');
          }

          // Password fields: skip if unchanged (masked value sent back), always encrypt
          const isPasswordField = setting_name.includes('password');
          if (isPasswordField && setting_value === '••••••••') {
            continue; // Admin didn't change the password — leave it as-is
          }

          // Determine encryption server-side; never trust the client flag for passwords
          const shouldEncrypt = isPasswordField;
          const finalValue = shouldEncrypt ? encrypt(setting_value) : setting_value;

          await client.query(`
            INSERT INTO email_settings (setting_name, setting_value, is_encrypted, updated_by)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (setting_name) 
            DO UPDATE SET 
              setting_value = EXCLUDED.setting_value,
              is_encrypted = EXCLUDED.is_encrypted,
              updated_by = EXCLUDED.updated_by,
              updated_at = CURRENT_TIMESTAMP
          `, [setting_name, finalValue, shouldEncrypt, userId]);
        }

        await client.query('COMMIT');

        return res.status(200).json({
          success: true,
          message: 'Email settings updated successfully'
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error updating email settings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update email settings'
      });
    }
  },

  /**
   * Test email configuration
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async testEmailSettings(req, res) {
    try {
      const { testEmail } = req.body;

      if (!testEmail) {
        return res.status(400).json({
          success: false,
          message: 'Test email address is required'
        });
      }

      // Get current email settings
      const settingsResult = await db.query('SELECT setting_name, setting_value, is_encrypted FROM email_settings');
      const settings = {};
      
      settingsResult.rows.forEach(row => {
        settings[row.setting_name] = row.is_encrypted ? decrypt(row.setting_value) : row.setting_value;
      });

      // Create transporter with current settings
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: settings.smtp_host,
        port: parseInt(settings.smtp_port),
        secure: settings.smtp_secure === 'true',
        auth: {
          user: settings.smtp_user,
          pass: settings.smtp_password,
        },
      });

      // Send test email
      await transporter.sendMail({
        from: `"${settings.from_name}" <${settings.from_email}>`,
        to: testEmail,
        subject: 'GKIN Email Configuration Test',
        text: 'This is a test email to verify your SMTP configuration is working correctly.',
        html: `
          <h2>Email Configuration Test</h2>
          <p>This is a test email to verify your SMTP configuration is working correctly.</p>
          <p><strong>Test sent at:</strong> ${new Date().toLocaleString()}</p>
          <p><em>GKIN Admin System</em></p>
        `
      });

      return res.status(200).json({
        success: true,
        message: 'Test email sent successfully'
      });
    } catch (error) {
      console.error('Error testing email settings:', error);

      // Translate SMTP error codes into human-friendly messages
      let friendlyMessage = 'Failed to send test email';
      if (error.code === 'EAUTH' || error.responseCode === 535) {
        friendlyMessage = 'Authentication failed — check your SMTP username and password.';
      } else if (error.code === 'ECONNREFUSED') {
        friendlyMessage = 'Connection refused — check the SMTP host and port.';
      } else if (error.code === 'ENOTFOUND') {
        friendlyMessage = `SMTP host not found — "${error.hostname || 'unknown'}" could not be resolved.`;
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
        friendlyMessage = 'Connection timed out — check the host, port, and firewall settings.';
      } else if (error.code === 'ESOCKET') {
        friendlyMessage = 'Socket error — verify the port and SSL/TLS setting (secure on/off).';
      } else if (error.responseCode) {
        friendlyMessage = `SMTP error ${error.responseCode}: ${error.response || error.message}`;
      } else if (error.message) {
        friendlyMessage = error.message;
      }

      return res.status(500).json({
        success: false,
        message: friendlyMessage
      });
    }
  },

  /**
   * Get email settings for internal use (returns decrypted values)
   * @returns {Object} Settings object
   */
  async getEmailSettingsInternal() {
    try {
      const result = await db.query('SELECT setting_name, setting_value, is_encrypted FROM email_settings');
      const settings = {};
      
      result.rows.forEach(row => {
        settings[row.setting_name] = row.is_encrypted ? decrypt(row.setting_value) : row.setting_value;
      });

      return settings;
    } catch (error) {
      console.error('Error fetching internal email settings:', error);
      return {};
    }
  }
};

module.exports = emailSettingsController;
module.exports.migrateEmailEncryption = migrateEmailEncryption;
module.exports.encrypt = encrypt;
module.exports.decrypt = decrypt;