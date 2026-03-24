'use strict';

/**
 * Phase 1 — Config security tests
 *
 * Covers:
 *  1. Missing JWT_SECRET in production throws
 *  2. Missing EMAIL_ENCRYPTION_KEY in production throws
 *  3. Both present → module loads fine
 *  4. Missing vars in non-production → module loads (uses fallback)
 */

describe('config — fail-fast on missing secrets (production)', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    // Reset module registry so config.js is re-evaluated each test
    jest.resetModules();
    // Shallow-copy env so mutations don't leak between tests
    process.env = { ...ORIGINAL_ENV };
    // Prevent dotenv from re-reading .env and overwriting our controlled env
    jest.mock('dotenv', () => ({ config: jest.fn() }));
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test('throws when JWT_SECRET is absent in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    process.env.EMAIL_ENCRYPTION_KEY = 'some-key';
    expect(() => require('../config/config')).toThrow(/JWT_SECRET/);
  });

  test('throws when EMAIL_ENCRYPTION_KEY is absent in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'some-secret';
    delete process.env.EMAIL_ENCRYPTION_KEY;
    expect(() => require('../config/config')).toThrow(/EMAIL_ENCRYPTION_KEY/);
  });

  test('does not throw when both secrets are present in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'real-secret';
    process.env.EMAIL_ENCRYPTION_KEY = 'real-key';
    expect(() => require('../config/config')).not.toThrow();
  });

  test('does not throw in development even when secrets are absent', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_SECRET;
    delete process.env.EMAIL_ENCRYPTION_KEY;
    expect(() => require('../config/config')).not.toThrow();
  });
});
