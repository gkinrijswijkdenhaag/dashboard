const db = require('../config/db');
const { sendEmailInternal } = require('./emailController');
const roleEmailsController = require('./roleEmailsController');
const { buildMentionEmail } = require('../utils/emailTemplates');
const config = require('../config/config');

const MENTIONABLE_ROLES = new Set(['liturgy', 'translation', 'beamer', 'music', 'treasurer', 'admin']);

/**
 * Get recent chat messages
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getMessages = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const messages = await db.query(
      `SELECT m.id, m.content, m.created_at, m.mentions,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'role', u.role,
          'avatar_url', u.avatar_url
        ) as sender
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      ORDER BY m.created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    res.status(200).json(messages.rows.reverse()); // Return in chronological order
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
};

/**
 * Create a new message
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const createMessage = async (req, res) => {
  try {
    const { content, mentions, noEmailNotification } = req.body;
    const userId = req.user.id;
    
    // Validate request
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    // Insert the message
    const result = await db.query(
      'INSERT INTO messages (sender_id, content, mentions) VALUES ($1, $2, $3) RETURNING *',
      [userId, content, JSON.stringify(mentions || [])]
    );
    
    const messageId = result.rows[0].id;

    // Get the complete message with sender info
    const messageWithSender = await db.query(
      `SELECT m.id, m.content, m.created_at, m.mentions,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'role', u.role,
          'avatar_url', u.avatar_url
        ) as sender
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = $1`,
      [messageId]
    );
    
    const message = messageWithSender.rows[0];

    // Collect unique mentionable role mentions (for email sending)
    const mentionedRoles = Array.isArray(mentions)
      ? [...new Set(mentions.filter((m) => m.type === 'role' && MENTIONABLE_ROLES.has(m.value)).map((m) => m.value))]
      : [];

    // Note: message_mentions rows are created automatically by the DB trigger
    // trigger_create_message_mentions on messages INSERT.

    // Capture sender info before the response closes the request context
    const sender = { id: req.user.id, username: req.user.username, role: req.user.role };

    // Respond immediately so the sender sees their message without waiting for emails
    res.status(201).json(message);

    // Fire-and-forget: send mention emails in the background
    if (mentionedRoles.length > 0 && !noEmailNotification) {
      setImmediate(async () => {
        try {
          // Fetch up to 3 messages before this one for context
          const contextResult = await db.query(
            `SELECT m.content, m.created_at,
              json_build_object('id', u.id, 'username', u.username, 'role', u.role) as sender
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.id < $1
            ORDER BY m.id DESC
            LIMIT 3`,
            [messageId]
          );
          const contextMessages = contextResult.rows.reverse();

          await Promise.all(
            mentionedRoles.map(async (role) => {
              try {
                const roleEmailResult = await roleEmailsController.getRoleEmailInternal(role);
                if (!roleEmailResult?.email) return;

                const { subject, html } = buildMentionEmail({
                  senderUsername: sender.username,
                  senderRole: sender.role,
                  mentionedRole: role,
                  contextMessages,
                  mentionMessage: message,
                  appUrl: config.frontendUrl,
                });

                await sendEmailInternal({
                  user: sender,
                  body: {
                    to: roleEmailResult.email,
                    subject,
                    message: `${sender.username} mentioned @${role} in GKIN chat.`,
                    html,
                    documentType: 'mention',
                    recipientType: role,
                  },
                });
              } catch (emailError) {
                console.warn(`Failed to send mention email to @${role}:`, emailError.message);
              }
            })
          );
        } catch (err) {
          console.warn('Mention email background task failed:', err.message);
        }
      });
    }
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ message: 'Error creating message' });
  }
};

/**
 * Get mentions for a user or role
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getMentions = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    // Get mentions for this user (by ID or role)
    const mentions = await db.query(
      `SELECT mm.id, mm.is_read, mm.created_at,
        m.id as message_id, m.content, m.created_at as message_created_at,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'role', u.role,
          'avatar_url', u.avatar_url
        ) as sender
      FROM message_mentions mm
      JOIN messages m ON mm.message_id = m.id
      JOIN users u ON m.sender_id = u.id
      WHERE (mm.mentioned_user_id = $1 OR mm.mentioned_role = $2)
      ORDER BY mm.created_at DESC
      LIMIT $3 OFFSET $4`,
      [userId, userRole, limit, offset]
    );
    
    res.status(200).json(mentions.rows);
  } catch (error) {
    console.error('Error fetching mentions:', error);
    res.status(500).json({ message: 'Error fetching mentions' });
  }
};

/**
 * Mark mentions as read
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const markMentionsAsRead = async (req, res) => {
  try {
    const { mentionIds } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!mentionIds || !Array.isArray(mentionIds) || mentionIds.length === 0) {
      return res.status(400).json({ message: 'Mention IDs are required' });
    }
    
    // Only allow updating mentions that belong to this user
    await db.query(
      `UPDATE message_mentions 
      SET is_read = TRUE 
      WHERE id = ANY($1) AND (mentioned_user_id = $2 OR mentioned_role = $3)`,
      [mentionIds, userId, userRole]
    );
    
    res.status(200).json({ message: 'Mentions marked as read' });
  } catch (error) {
    console.error('Error marking mentions as read:', error);
    res.status(500).json({ message: 'Error marking mentions as read' });
  }
};

/**
 * Get unread mention count
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getUnreadMentionCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const result = await db.query(
      `SELECT COUNT(*) FROM message_mentions 
      WHERE (mentioned_user_id = $1 OR mentioned_role = $2) AND is_read = FALSE`,
      [userId, userRole]
    );
    
    res.status(200).json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error fetching unread mention count:', error);
    res.status(500).json({ message: 'Error fetching unread mention count' });
  }
};

module.exports = {
  getMessages,
  createMessage,
  getMentions,
  markMentionsAsRead,
  getUnreadMentionCount
};
