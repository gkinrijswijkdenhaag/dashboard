'use strict';

/**
 * Phase 2 — Public schedule date validation tests
 *
 * Covers:
 *  1. Valid ISO dates are accepted (200)
 *  2. Invalid 'from' date returns 400
 *  3. Invalid 'to' date returns 400
 *  4. Missing params use defaults (200)
 *  5. SQL injection attempt via date param is rejected (400)
 */

const request = require('supertest');
const express = require('express');

// Mock DB so no real connection is needed
jest.mock('../config/db', () => ({
  query: jest.fn().mockResolvedValue({ rows: [] }),
}));

function buildApp() {
  jest.resetModules();
  const app = express();
  app.use(express.json());
  const scheduleRouter = require('../routes/publicSchedule');
  app.use('/api/public/schedule', scheduleRouter);
  return app;
}

describe('GET /api/public/schedule — date validation', () => {
  let app;

  beforeAll(() => {
    app = buildApp();
  });

  test('accepts valid ISO dates and returns 200', async () => {
    const res = await request(app)
      .get('/api/public/schedule')
      .query({ from: '2026-01-01', to: '2026-06-30' });
    expect(res.status).toBe(200);
  });

  test('returns 400 for an invalid "from" date', async () => {
    const res = await request(app)
      .get('/api/public/schedule')
      .query({ from: 'not-a-date', to: '2026-06-30' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/from/i);
  });

  test('returns 400 for an invalid "to" date', async () => {
    const res = await request(app)
      .get('/api/public/schedule')
      .query({ from: '2026-01-01', to: 'bad' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/to/i);
  });

  test('returns 400 for a SQL injection attempt in "from"', async () => {
    const res = await request(app)
      .get('/api/public/schedule')
      .query({ from: "2026-01-01'; DROP TABLE users;--" });
    expect(res.status).toBe(400);
  });

  test('returns 400 for month 13 (logically invalid date)', async () => {
    const res = await request(app)
      .get('/api/public/schedule')
      .query({ from: '2026-13-01' });
    expect(res.status).toBe(400);
  });

  test('returns 200 when no query params are given (defaults used)', async () => {
    const res = await request(app).get('/api/public/schedule');
    expect(res.status).toBe(200);
  });
});
