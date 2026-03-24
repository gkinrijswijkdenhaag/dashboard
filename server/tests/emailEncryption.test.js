'use strict';

/**
 * Phase 2 — Email settings encryption tests
 *
 * Covers:
 *  1. encrypt() produces s2: prefix (new format)
 *  2. encrypt() produces unique ciphertexts for the same input (random salt/IV)
 *  3. decrypt() correctly decrypts new-format ciphertexts
 *  4. decrypt() correctly decrypts legacy-format ciphertexts (backward compat)
 *  5. decrypt() returns the value as-is when it is not encrypted
 *  6. migrateEmailEncryption() re-encrypts old-format rows and skips new ones
 */

// Prevent DB and dotenv from initialising during import
jest.mock('../config/db', () => ({ query: jest.fn() }));
jest.mock('../config/config', () => ({ jwtSecret: 'test', jwtExpiration: '1h' }));

const crypto = require('crypto');

// Load the functions under test
const {
  encrypt,
  decrypt,
  migrateEmailEncryption,
} = require('../controllers/emailSettingsController');

// ─── encrypt / decrypt ────────────────────────────────────────────────────────

describe('encrypt', () => {
  test('output starts with "s2:" (new format marker)', () => {
    const result = encrypt('my-secret');
    expect(result.startsWith('s2:')).toBe(true);
  });

  test('contains salt + iv + ciphertext separated by colons', () => {
    const result = encrypt('my-secret');
    const parts = result.split(':');
    // s2 : salt_hex : iv_hex : ciphertext  →  4 or more parts
    expect(parts.length).toBeGreaterThanOrEqual(4);
    expect(parts[0]).toBe('s2');
  });

  test('produces different ciphertexts for the same plaintext (random salt+IV)', () => {
    const a = encrypt('same-text');
    const b = encrypt('same-text');
    expect(a).not.toBe(b);
  });
});

describe('decrypt', () => {
  test('round-trips correctly with new s2 format', () => {
    const plaintext = 'super-secret-password!';
    const ciphertext = encrypt(plaintext);
    expect(decrypt(ciphertext)).toBe(plaintext);
  });

  test('decrypts legacy format (static salt "salt")', () => {
    // Reproduce the legacy encrypt function inline
    const ENCRYPTION_KEY =
      process.env.EMAIL_ENCRYPTION_KEY || 'gkin_email_settings_key_change_in_production';
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update('legacy-value', 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const legacyCiphertext = `${iv.toString('hex')}:${encrypted}`;

    // decrypt() must handle this without throwing
    expect(decrypt(legacyCiphertext)).toBe('legacy-value');
  });

  test('returns the input as-is when it is plain text (not encrypted)', () => {
    expect(decrypt('plain-text-value')).toBe('plain-text-value');
  });

  test('returns undefined when given undefined', () => {
    expect(decrypt(undefined)).toBeUndefined();
  });
});

// ─── migrateEmailEncryption ───────────────────────────────────────────────────

describe('migrateEmailEncryption', () => {
  const db = require('../config/db');

  beforeEach(() => jest.clearAllMocks());

  test('re-encrypts rows stored in legacy format', async () => {
    // Build a real legacy ciphertext
    const ENCRYPTION_KEY =
      process.env.EMAIL_ENCRYPTION_KEY || 'gkin_email_settings_key_change_in_production';
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let enc = cipher.update('smtp-password', 'utf8', 'hex');
    enc += cipher.final('hex');
    const legacyCiphertext = `${iv.toString('hex')}:${enc}`;

    // DB returns one legacy-format row
    db.query.mockResolvedValueOnce({
      rows: [{ id: 5, setting_name: 'smtp_password', setting_value: legacyCiphertext }],
    });
    // UPDATE call
    db.query.mockResolvedValueOnce({ rows: [] });

    await migrateEmailEncryption();

    // UPDATE should have been called once
    const updateCall = db.query.mock.calls[1];
    expect(updateCall[0]).toMatch(/UPDATE email_settings/i);
    // New value should use s2 format
    const newValue = updateCall[1][0];
    expect(newValue.startsWith('s2:')).toBe(true);
    // And it must decrypt back to the original plaintext
    expect(decrypt(newValue)).toBe('smtp-password');
  });

  test('skips rows already in s2 format', async () => {
    const alreadyMigrated = encrypt('already-safe');
    db.query.mockResolvedValueOnce({
      rows: [{ id: 6, setting_name: 'smtp_password', setting_value: alreadyMigrated }],
    });

    await migrateEmailEncryption();

    // Only the SELECT query should have been executed — no UPDATE
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test('does not throw when the email_settings table is empty', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(migrateEmailEncryption()).resolves.not.toThrow();
  });
});
