'use strict';

/**
 * Phase 1 — Rate limiting integration test
 *
 * Covers:
 *  1. Login endpoint allows up to 10 requests per 15-minute window
 *  2. The 11th request within the window receives HTTP 429
 *
 * Uses supertest against a minimal Express app that mounts only the auth router.
 * The database is mocked so no real DB connection is needed.
 */

const request = require('supertest');
const express = require('express');

// Mock DB so no real connection is attempted
jest.mock('../config/db', () => ({
  query: jest.fn().mockResolvedValue({ rows: [] }),
}));

// Mock config to avoid production secret checks
jest.mock('../config/config', () => ({
  jwtSecret: 'test-secret',
  jwtExpiration: '1h',
}));

// Build a minimal app with the real auth router (which includes the rate limiter)
function buildApp() {
  const app = express();
  app.use(express.json());
  // Reset the router module so each test gets a fresh rate-limit counter
  jest.resetModules();
  const authRouter = require('../routes/auth');
  app.use('/api/auth', authRouter);
  return app;
}

describe('POST /api/auth/login — rate limiter', () => {
  let app;

  beforeAll(() => {
    app = buildApp();
  });

  test('allows the first 10 requests (no 429)', async () => {
    const body = { username: 'u', role: 'liturgy', passcode: 'wrong' };
    // 10 sequential requests — all should get through (401 from controller, not 429)
    for (let i = 0; i < 10; i++) {
      const res = await request(app).post('/api/auth/login').send(body);
      expect(res.status).not.toBe(429);
    }
  });

  test('blocks the 11th request with 429', async () => {
    const body = { username: 'u', role: 'liturgy', passcode: 'wrong' };
    const res = await request(app).post('/api/auth/login').send(body);
    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/too many/i);
  });
});
