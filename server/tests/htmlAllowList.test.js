'use strict';

/**
 * Phase 3 — HTML sanitization allow-list unit tests
 *
 * Tests the real sanitize-html library using the same allow-list
 * configured in emailController.js. No mocks — this exercises the
 * actual sanitization behaviour.
 *
 * Covers:
 *  1. Safe formatting HTML is preserved
 *  2. <script> tags and content are stripped
 *  3. Event handler attributes (onclick, onerror) are stripped
 *  4. <iframe> is stripped
 *  5. javascript: href is stripped
 *  6. Safe https links are preserved
 */

const sanitizeHtml = require('sanitize-html');

// Mirror the allow-list from emailController.js
const ALLOWED_EMAIL_HTML = {
  allowedTags: [
    'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'blockquote', 'pre', 'code', 'span', 'div',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    '*': ['style'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
};

const sanitize = (input) => sanitizeHtml(input, ALLOWED_EMAIL_HTML);

describe('HTML allow-list sanitization', () => {
  test('preserves safe formatting tags', () => {
    const input = '<p><strong>Hello</strong> <em>world</em></p>';
    expect(sanitize(input)).toBe('<p><strong>Hello</strong> <em>world</em></p>');
  });

  test('strips <script> tags and their content', () => {
    const input = '<p>Safe</p><script>alert("xss")</script>';
    const result = sanitize(input);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
    expect(result).toContain('<p>Safe</p>');
  });

  test('strips onclick event handler attributes', () => {
    const input = '<p onclick="alert(1)">Click me</p>';
    const result = sanitize(input);
    expect(result).not.toContain('onclick');
    expect(result).toContain('Click me');
  });

  test('strips onerror from img tags (img itself is also dropped)', () => {
    const input = '<img src="x" onerror="alert(1)">';
    const result = sanitize(input);
    expect(result).not.toContain('onerror');
  });

  test('strips <iframe> tags', () => {
    const input = '<p>Text</p><iframe src="https://evil.com"></iframe>';
    const result = sanitize(input);
    expect(result).not.toContain('<iframe');
    expect(result).toContain('<p>Text</p>');
  });

  test('strips javascript: href links', () => {
    const input = '<a href="javascript:alert(1)">Click</a>';
    const result = sanitize(input);
    expect(result).not.toContain('javascript:');
  });

  test('preserves safe https links', () => {
    const input = '<a href="https://gkin.example.com">Visit</a>';
    const result = sanitize(input);
    expect(result).toContain('href="https://gkin.example.com"');
  });

  test('preserves mailto links', () => {
    const input = '<a href="mailto:info@example.com">Email us</a>';
    const result = sanitize(input);
    expect(result).toContain('href="mailto:info@example.com"');
  });
});
