'use strict';

const roleDisplayNames = {
  liturgy: 'Liturgy Maker',
  pastor: 'Pastor',
  translation: 'Translator',
  beamer: 'Beamer Team',
  music: 'Musicians',
  treasurer: 'Treasurer',
  admin: 'Administrator',
};

const roleColors = {
  liturgy: '#3b82f6',
  pastor: '#8b5cf6',
  translation: '#16a34a',
  beamer: '#ea580c',
  music: '#db2777',
  treasurer: '#059669',
  admin: '#4f46e5',
};

/**
 * Build an HTML email for a chat @mention notification.
 * @param {Object} params
 * @param {string} params.senderUsername
 * @param {string} params.senderRole
 * @param {string} params.mentionedRole
 * @param {Array}  params.contextMessages  Up to 3 prior messages [{sender: {username}, content}]
 * @param {Object} params.mentionMessage   {sender: {username}, content}
 * @param {string} params.appUrl
 * @returns {{ subject: string, html: string }}
 */
function buildMentionEmail({ senderUsername, senderRole, mentionedRole, contextMessages = [], mentionMessage, appUrl }) {
  const mentionedRoleName = roleDisplayNames[mentionedRole] || mentionedRole;
  const senderRoleName = roleDisplayNames[senderRole] || senderRole;
  const senderColor = roleColors[senderRole] || '#6b7280';
  const senderInitial = (senderUsername || '?')[0].toUpperCase();

  const subject = `${senderUsername} mentioned @${mentionedRole} in chat`;

  const contextRowsHtml = contextMessages
    .map(
      (m) => `
        <tr>
          <td style="padding:5px 0 5px 12px;color:#6b7280;font-size:13px;border-left:3px solid #e5e7eb;">
            <strong style="color:#9ca3af;font-weight:600;">${escapeHtml(m.sender?.username || 'Unknown')}</strong>
            <span style="margin-left:6px;">${escapeHtml(m.content)}</span>
          </td>
        </tr>`
    )
    .join('');

  const contextSectionHtml =
    contextMessages.length > 0
      ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;background-color:#f9fafb;border-radius:8px;border:1px solid #f3f4f6;padding:12px;">
          <tr><td style="padding:0 0 8px 0;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Earlier in conversation</td></tr>
          ${contextRowsHtml}
        </table>`
      : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background-color:#1e3a8a;padding:20px 28px;">
              <p style="margin:0;font-size:16px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">GKIN RWDH</p>
              <p style="margin:4px 0 0;font-size:12px;color:#93c5fd;">Chat Notification</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px;">

              <!-- Sender -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="vertical-align:middle;">
                    <div style="width:42px;height:42px;border-radius:10px;background-color:${senderColor};text-align:center;line-height:42px;font-size:17px;font-weight:700;color:#ffffff;">
                      ${senderInitial}
                    </div>
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${escapeHtml(senderUsername)}</p>
                    <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">${escapeHtml(senderRoleName)}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px;font-size:15px;color:#374151;">
                mentioned <strong style="color:#1d4ed8;">@${escapeHtml(mentionedRole)}</strong> in the team chat,
                notifying the <strong>${escapeHtml(mentionedRoleName)}</strong>.
              </p>

              ${contextSectionHtml}

              <!-- Highlighted mention message -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background-color:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#2563eb;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(senderUsername)} said:</p>
                    <p style="margin:0;font-size:14px;color:#1e3a8a;line-height:1.6;">${escapeHtml(mentionMessage?.content || '')}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background-color:#2563eb;">
                    <a href="${appUrl}" target="_blank" style="display:inline-block;padding:11px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                      Open Chat
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 28px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                You received this because the <strong>${escapeHtml(mentionedRoleName)}</strong> role was mentioned in GKIN chat.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { buildMentionEmail };
