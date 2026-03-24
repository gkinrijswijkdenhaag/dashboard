const db = require("../config/db");

/**
 * Log an email to the history
 * @param {Object} emailData - Email data to log
 */
const logEmail = async (emailData) => {
  try {
    const {
      senderId,
      senderRole,
      senderUsername,
      to,
      cc,
      subject,
      message,
      documentType,
      documentLink,
      serviceDate,
      recipientType,
      messageId,
      status = 'sent',
      errorMessage = null
    } = emailData;

    const query = `
      INSERT INTO email_history (
        sender_id, sender_role, sender_username, to_email, cc_emails,
        subject, message, document_type, document_link, service_date,
        recipient_type, message_id, status, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, sent_at
    `;

    const values = [
      senderId,
      senderRole,
      senderUsername,
      to,
      cc || null,
      subject,
      message,
      documentType || null,
      documentLink || null,
      serviceDate || null,
      recipientType || null,
      messageId || null,
      status,
      errorMessage
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error logging email to history:', error);
    throw error;
  }
};

/**
 * Get email history for a specific document type or all emails
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getEmailHistory = async (req, res) => {
  try {
    const { documentType, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        id,
        sender_id,
        sender_role,
        sender_username,
        to_email,
        cc_emails,
        subject,
        document_type,
        document_link,
        sent_at,
        status,
        message_id
      FROM email_history
    `;

    const values = [];
    let whereClause = '';

    if (documentType) {
      whereClause = ' WHERE document_type = $1';
      values.push(documentType);
    }

    query += whereClause;
    query += ' ORDER BY sent_at DESC';
    
    // Add pagination
    if (limit) {
      query += ` LIMIT $${values.length + 1}`;
      values.push(parseInt(limit));
    }
    
    if (offset) {
      query += ` OFFSET $${values.length + 1}`;
      values.push(parseInt(offset));
    }

    const result = await db.query(query, values);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM email_history';
    if (documentType) {
      countQuery += ' WHERE document_type = $1';
    }
    const countResult = await db.query(countQuery, documentType ? [documentType] : []);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      emails: result.rows,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + result.rows.length < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching email history:', error);
    res.status(500).json({ message: 'Failed to fetch email history' });
  }
};

/**
 * Get email history for a specific email thread/document
 * @param {Request} req - Express request object  
 * @param {Response} res - Express response object
 */
const getEmailHistoryByDocument = async (req, res) => {
  try {
    const { documentType } = req.params;
    const { serviceDate, recipientType } = req.query;

    // Validate documentType parameter
    if (!documentType) {
      return res.status(400).json({ 
        message: 'Document type is required',
        emails: []
      });
    }

    let query = `
      SELECT 
        id,
        sender_role,
        sender_username,
        to_email,
        cc_emails,
        subject,
        sent_at,
        status,
        service_date,
        recipient_type
      FROM email_history
      WHERE document_type = $1
    `;

    const queryParams = [documentType];
    let paramIndex = 2;

    // Add service date filter if provided
    if (serviceDate) {
      query += ` AND service_date = $${paramIndex}`;
      queryParams.push(serviceDate);
      paramIndex++;
    }

    // Add recipient type filter if provided
    if (recipientType) {
      query += ` AND recipient_type = $${paramIndex}`;
      queryParams.push(recipientType);
      paramIndex++;
    }

    query += ` ORDER BY sent_at DESC`;

    const result = await db.query(query, queryParams);

    // Always return a valid structure
    res.json({
      documentType,
      serviceDate: serviceDate || null,
      recipientType: recipientType || null,
      emails: result.rows || []
    });
  } catch (error) {
    console.error('Error fetching email history by document:', error);
    
    // Check if the error is because the table doesn't exist yet
    if (error.message && error.message.includes('relation "email_history" does not exist')) {
      console.log('Email history table does not exist yet, returning empty array');
      return res.json({
        documentType: req.params.documentType,
        serviceDate: req.query.serviceDate || null,
        recipientType: req.query.recipientType || null,
        emails: []
      });
    }
    
    // For other errors, return 500 but with a proper structure
    res.status(500).json({ 
      message: 'Failed to fetch email history',
      emails: []
    });
  }
};

module.exports = {
  logEmail,
  getEmailHistory,
  getEmailHistoryByDocument
};