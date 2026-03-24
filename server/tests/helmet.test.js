'use strict';

/**
 * Phase 2 — Helmet security headers integration test
 *
 * Covers:
 *  1. X-Content-Type-Options: nosniff is present
 *  2. X-Frame-Options is present (clickjacking protection)
 *  3. X-DNS-Prefetch-Control is present
 *  4. Content-Security-Policy is present
 *  5. X-Powered-By is removed by Helmet
 */

const request = require('supertest');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

// Build a minimal app that mirrors index.js middleware setup
function buildApp() {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10kb' }));
  app.get('/ping', (_req, res) => res.json({ ok: true }));
  return app;
}

describe('Helmet security headers', () => {
  let app;

  beforeAll(() => {
    app = buildApp();
  });

  test('sets X-Content-Type-Options: nosniff', async () => {
    const res = await request(app).get('/ping');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  test('sets X-Frame-Options', async () => {
    const res = await request(app).get('/ping');
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  test('sets X-DNS-Prefetch-Control', async () => {
    const res = await request(app).get('/ping');
    expect(res.headers['x-dns-prefetch-control']).toBeDefined();
  });

  test('sets Content-Security-Policy', async () => {
    const res = await request(app).get('/ping');
    expect(res.headers['content-security-policy']).toBeDefined();
  });

  test('removes X-Powered-By header', async () => {
    const res = await request(app).get('/ping');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('Request body size limit', () => {
  let app;

  beforeAll(() => {
    app = buildApp();
    // Add a POST endpoint that echoes the body
    app.post('/echo', (req, res) => res.json(req.body));
  });

  test('accepts bodies under 10 KB', async () => {
    const body = { data: 'x'.repeat(100) };
    const res = await request(app).post('/echo').send(body);
    expect(res.status).toBe(200);
  });

  test('rejects bodies over 10 KB with 413', async () => {
    const body = { data: 'x'.repeat(11 * 1024) };
    const res = await request(app)
      .post('/echo')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(body));
    expect(res.status).toBe(413);
  });
});
