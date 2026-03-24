'use strict';

/**
 * Phase 3 — sendEmail sanitization integration test
 *
 * Verifies that sendEmail passes the html field through sanitize-html
 * before handing it to nodemailer, so dangerous markup can't reach
 * the SMTP relay.
 */

jest.mock('sanitize-html', () => jest.fn((html) => `SANITIZED:${html}`));
jest.mock('../config/db', () => ({ query: jest.fn() }));
jest.mock('../config/config', () => ({ jwtSecret: 'test', jwtExpiration: '1h' }));
jest.mock('../controllers/emailSettingsController', () => ({
  getEmailSettingsInternal: jest.fn().mockResolvedValue({
    smtp_host: 'smtp.test.com',
    smtp_port: '465',
    smtp_secure: 'true',
    smtp_user: 'u',
    smtp_password: 'p',
    from_name: 'T',
    from_email: 'u@t.com',
  }),
}));
jest.mock('../controllers/emailHistoryController', () => ({ logEmail: jest.fn() }));

const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
}));

describe('sendEmail — sanitizes html field before sending', () => {
  beforeEach(() => jest.clearAllMocks());

  test('calls sanitizeHtml on the html field', async () => {
    const sanitize = require('sanitize-html');
    const { sendEmail } = require('../controllers/emailController');

    const mockRes = () => {
      const r = {};
      r.status = jest.fn().mockReturnValue(r);
      r.json = jest.fn().mockReturnValue(r);
      return r;
    };

    const req = {
      user: { id: 1, role: 'liturgy', username: 'tester' },
      body: {
        to: 'dest@example.com',
        subject: 'Test',
        message: 'Hello',
        html: '<script>alert(1)</script><p>Hello</p>',
      },
    };

    await sendEmail(req, mockRes());

    // sanitizeHtml must have been called with the raw html body
    expect(sanitize).toHaveBeenCalledWith(
      '<script>alert(1)</script><p>Hello</p>',
      expect.any(Object)
    );

    // The value passed to sendMail must be the sanitized version
    const sentOptions = mockSendMail.mock.calls[0][0];
    expect(sentOptions.html).toContain('SANITIZED:');
  });

  test('omits html from mailOptions when no html field is provided', async () => {
    const { sendEmail } = require('../controllers/emailController');

    const mockRes = () => {
      const r = {};
      r.status = jest.fn().mockReturnValue(r);
      r.json = jest.fn().mockReturnValue(r);
      return r;
    };

    const req = {
      user: { id: 1, role: 'liturgy', username: 'tester' },
      body: { to: 'dest@example.com', subject: 'Test', message: 'Hello' },
    };

    await sendEmail(req, mockRes());
    const sentOptions = mockSendMail.mock.calls[0][0];
    expect(sentOptions.html).toBeUndefined();
  });
});
