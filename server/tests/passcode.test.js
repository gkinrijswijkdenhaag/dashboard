'use strict';

/**
 * Phase 1 — Passcode controller tests
 *
 * Covers:
 *  1. updatePasscode hashes the passcode before storing
 *  2. updatePasscode requires admin role
 *  3. updatePasscode returns 400 when role or passcode is missing
 *  4. getAllPasscodes is restricted to admin role
 */

const bcrypt = require('bcrypt');

jest.mock('../config/db', () => ({
  query: jest.fn(),
}));

const db = require('../config/db');
const { updatePasscode, getAllPasscodes } = require('../controllers/passcodeController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('passcodeController.updatePasscode', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 403 for non-admin users', async () => {
    const req = { user: { role: 'liturgy' }, body: { role: 'liturgy', passcode: 'new123' } };
    const res = mockRes();
    await updatePasscode(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns 400 when passcode is missing', async () => {
    const req = { user: { role: 'admin' }, body: { role: 'liturgy', passcode: '' } };
    const res = mockRes();
    await updatePasscode(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('hashes the passcode with bcrypt before storing', async () => {
    // role exists check
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    // UPDATE
    db.query.mockResolvedValueOnce({ rows: [] });

    const req = { user: { role: 'admin' }, body: { role: 'liturgy', passcode: 'newPasscode!' } };
    const res = mockRes();
    await updatePasscode(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    // The UPDATE query should receive a bcrypt hash, not the plain passcode
    const updateCall = db.query.mock.calls[1]; // index 1 = UPDATE call
    const storedValue = updateCall[1][0]; // first param of parameterised query
    expect(storedValue).not.toBe('newPasscode!');
    expect(storedValue.startsWith('$2b$')).toBe(true);
    const matches = await bcrypt.compare('newPasscode!', storedValue);
    expect(matches).toBe(true);
  });

  test('returns 404 when role does not exist', async () => {
    db.query.mockResolvedValueOnce({ rows: [] }); // role not found
    const req = { user: { role: 'admin' }, body: { role: 'unknown', passcode: 'abc' } };
    const res = mockRes();
    await updatePasscode(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('passcodeController.getAllPasscodes', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 403 for non-admin users', async () => {
    const req = { user: { role: 'music' } };
    const res = mockRes();
    await getAllPasscodes(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns passcodes list for admin (without hash values)', async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        { id: 1, role: 'liturgy', created_at: new Date(), updated_at: new Date() },
        { id: 2, role: 'music', created_at: new Date(), updated_at: new Date() },
      ],
    });
    const req = { user: { role: 'admin' } };
    const res = mockRes();
    await getAllPasscodes(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0];
    // The SELECT query in the controller does NOT return passcode column
    data.forEach((row) => expect(row).not.toHaveProperty('passcode'));
  });
});
