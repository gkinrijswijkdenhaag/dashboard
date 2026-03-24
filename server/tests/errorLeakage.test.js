'use strict';

/**
 * Phase 3 — Error message leakage tests
 *
 * Verifies that no controller returns raw error.message strings in HTTP 500
 * responses (which would leak DB schema / internal stack details to callers).
 *
 * Covers:
 *  adminController: clearAllMessages, getMessageStats, getSystemStatus
 *  emailHistoryController: getEmailHistory
 *  emailSettingsController: getEmailSettings, updateEmailSettings
 */

jest.mock('../config/db', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
}));
jest.mock('../config/config', () => ({ jwtSecret: 'test', jwtExpiration: '1h' }));

const db = require('../config/db');

const mockRes = () => {
  const r = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
};

// Helper: force the DB to throw and return the response JSON body
const forceErrorAndCapture = async (handler, req = {}) => {
  const error = new Error('relation "users" does not exist');  // realistic DB error
  db.query.mockRejectedValue(error);
  const res = mockRes();
  await handler(req, res);
  return res.json.mock.calls[0]?.[0];
};

// ─── adminController ──────────────────────────────────────────────────────────

describe('adminController — no error.message in 500 responses', () => {
  const adminController = require('../controllers/adminController');

  beforeEach(() => jest.clearAllMocks());

  test('clearAllMessages does not leak error.message', async () => {
    const fakeClient = {
      query: jest.fn().mockRejectedValue(new Error('DB schema error')),
      release: jest.fn(),
    };
    db.getClient.mockResolvedValue(fakeClient);
    const res = mockRes();
    await adminController.clearAllMessages({}, res);
    const body = res.json.mock.calls[0][0];
    expect(body).not.toHaveProperty('error');
    expect(JSON.stringify(body)).not.toContain('DB schema error');
  });

  test('getMessageStats does not leak error.message', async () => {
    db.query.mockRejectedValue(new Error('column users.secret does not exist'));
    const res = mockRes();
    await adminController.getMessageStats({}, res);
    // getMessageStats catches inner errors and uses defaults — should still return 200
    // The outer catch is what we test for 500 — force it via a different path
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(JSON.stringify(body)).not.toContain('column users.secret');
  });

  test('getSystemStatus does not expose DB error message', async () => {
    db.query.mockRejectedValue(new Error('connection refused internal'));
    const res = mockRes();
    await adminController.getSystemStatus({}, res);
    const body = res.json.mock.calls[0][0];
    // Status endpoint catches the DB error internally and returns 200 with disconnected status
    expect(JSON.stringify(body)).not.toContain('connection refused internal');
    expect(body.status?.database?.error).toBeUndefined();
  });
});

// ─── emailHistoryController ───────────────────────────────────────────────────

describe('emailHistoryController — no error.message in 500 responses', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getEmailHistory does not leak error.message', async () => {
    db.query.mockRejectedValue(new Error('internal table structure secret'));
    const { getEmailHistory } = require('../controllers/emailHistoryController');
    const req = { query: {} };
    const res = mockRes();
    await getEmailHistory(req, res);
    const body = res.json.mock.calls[0][0];
    expect(JSON.stringify(body)).not.toContain('internal table structure secret');
  });
});

// ─── emailSettingsController ──────────────────────────────────────────────────

describe('emailSettingsController — no error.message in 500 responses', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getEmailSettings does not leak error.message', async () => {
    db.query.mockRejectedValue(new Error('pg internal error details'));
    const emailSettingsController = require('../controllers/emailSettingsController');
    const req = { user: { id: 1, role: 'admin' } };
    const res = mockRes();
    await emailSettingsController.getEmailSettings(req, res);
    const body = res.json.mock.calls[0][0];
    expect(JSON.stringify(body)).not.toContain('pg internal error details');
  });

  test('updateEmailSettings does not leak error.message', async () => {
    db.query.mockRejectedValue(new Error('column smtp_password leak'));
    const emailSettingsController = require('../controllers/emailSettingsController');
    // getClient used inside updateEmailSettings
    const fakeClient = {
      query: jest.fn().mockRejectedValue(new Error('column smtp_password leak')),
      release: jest.fn(),
    };
    db.getClient.mockResolvedValue(fakeClient);
    const req = {
      user: { id: 1, role: 'admin' },
      body: { settings: [{ setting_name: 'smtp_host', setting_value: 'test.com' }] },
    };
    const res = mockRes();
    await emailSettingsController.updateEmailSettings(req, res);
    const body = res.json.mock.calls[0][0];
    expect(JSON.stringify(body)).not.toContain('smtp_password leak');
  });
});
