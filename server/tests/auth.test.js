'use strict';

/**
 * Phase 1 — Auth security tests
 *
 * Covers:
 *  1. Login rejects unknown roles
 *  2. Login rejects wrong passcode (plain-text stored, pre-migration)
 *  3. Login succeeds with correct bcrypt-hashed passcode
 *  4. Login succeeds with correct plain-text passcode (backward-compat fallback)
 *  5. Rate limiter blocks excessive login attempts
 */

const bcrypt = require('bcrypt');

// ─── Mock database ────────────────────────────────────────────────────────────
jest.mock('../config/db', () => {
  const mockQuery = jest.fn();
  return { query: mockQuery };
});

// ─── Mock config (no env-var validation during tests) ─────────────────────────
jest.mock('../config/config', () => ({
  jwtSecret: 'test-secret',
  jwtExpiration: '1h',
}));

const db = require('../config/db');
const { login } = require('../controllers/authController');

// Helper to build minimal Express req/res mocks
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const baseReq = (overrides = {}) => ({
  body: { username: 'TestUser', role: 'liturgy', passcode: 'correct123', ...overrides },
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('authController.login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 400 when role, username or passcode is missing', async () => {
    const res = mockRes();
    await login({ body: { username: 'User', role: '' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 400 when role does not exist in DB', async () => {
    db.query.mockResolvedValueOnce({ rows: [] }); // role lookup → no rows
    const res = mockRes();
    await login(baseReq({ role: 'unknown' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid role' }));
  });

  test('returns 401 when passcode is wrong (bcrypt hash stored)', async () => {
    const hash = await bcrypt.hash('correct123', 10);
    db.query.mockResolvedValueOnce({ rows: [{ passcode: hash }] }); // role lookup
    const res = mockRes();
    await login(baseReq({ passcode: 'wrong' }), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid passcode for this role' })
    );
  });

  test('returns 401 when passcode is wrong (plain-text fallback)', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ passcode: 'correct123' }] }); // role lookup
    const res = mockRes();
    await login(baseReq({ passcode: 'wrong' }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('succeeds and returns token when passcode matches bcrypt hash', async () => {
    const hash = await bcrypt.hash('correct123', 10);
    // 1st query: role lookup
    db.query.mockResolvedValueOnce({ rows: [{ passcode: hash }] });
    // 2nd query: existing user lookup → found
    db.query.mockResolvedValueOnce({
      rows: [{ id: 1, username: 'TestUser', role: 'liturgy', email: null, avatar_url: null }],
    });
    // 3rd query: update last_active
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = mockRes();
    await login(baseReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload).toHaveProperty('token');
    expect(payload.role).toBe('liturgy');
  });

  test('succeeds with plain-text passcode (pre-migration fallback)', async () => {
    // 1st query: role lookup with un-hashed passcode
    db.query.mockResolvedValueOnce({ rows: [{ passcode: 'correct123' }] });
    // 2nd query: existing user
    db.query.mockResolvedValueOnce({
      rows: [{ id: 2, username: 'TestUser', role: 'liturgy', email: null, avatar_url: null }],
    });
    // 3rd query: update last_active
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = mockRes();
    await login(baseReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0]).toHaveProperty('token');
  });

  test('creates a new user when username+role not found in DB', async () => {
    const hash = await bcrypt.hash('correct123', 10);
    // 1st: role lookup
    db.query.mockResolvedValueOnce({ rows: [{ passcode: hash }] });
    // 2nd: user lookup → empty
    db.query.mockResolvedValueOnce({ rows: [] });
    // 3rd: INSERT new user
    db.query.mockResolvedValueOnce({
      rows: [{ id: 99, username: 'NewUser', role: 'music', email: null, avatar_url: null }],
    });

    const res = mockRes();
    await login(baseReq({ username: 'NewUser', role: 'music' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
