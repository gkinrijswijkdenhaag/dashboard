const db = require('../config/db');

/**
 * Admin controller for administrative operations
 */
const adminController = {
  /**
   * Clear all messages and related data (mentions, etc.)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response with status
   */
  async clearAllMessages(req, res) {
    try {
      // Start a database transaction to ensure all operations succeed or fail together
      const client = await db.getClient();
      
      try {
        await client.query('BEGIN');
        
        // Delete all message mentions first (due to foreign key constraints)
        await client.query('DELETE FROM message_mentions');
        
        // Delete all messages
        await client.query('DELETE FROM messages');
        
        // Commit the transaction
        await client.query('COMMIT');
        
        return res.status(200).json({
          success: true,
          message: 'All messages and related data have been cleared'
        });
      } catch (error) {
        // If anything fails, roll back the transaction
        await client.query('ROLLBACK');
        throw error;
      } finally {
        // Release the client back to the pool
        client.release();
      }
    } catch (error) {
      console.error('Error clearing messages:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to clear messages'
      });
    }
  },
  
  /**
   * Get message statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response with stats
   */
  async getMessageStats(req, res) {
    try {
      // Initialize default values
      let messageCount = 0;
      let mentionCount = 0;
      let topUsers = [];
      
      try {
        // Get message count
        const messageCountResult = await db.query('SELECT COUNT(*) as count FROM messages');
        messageCount = parseInt(messageCountResult.rows[0].count);
      } catch (error) {
        console.error('Error counting messages:', error);
        // Continue execution even if this query fails
      }
      
      try {
        // Get mention count
        const mentionCountResult = await db.query('SELECT COUNT(*) as count FROM message_mentions');
        mentionCount = parseInt(mentionCountResult.rows[0].count);
      } catch (error) {
        console.error('Error counting mentions:', error);
        // Continue execution even if this query fails
      }
      
      try {
        // Get user message counts
        const userMessageCountsResult = await db.query(`
          SELECT u.username, COUNT(m.id) as message_count
          FROM users u
          LEFT JOIN messages m ON m.sender_id = u.id
          GROUP BY u.username
          ORDER BY message_count DESC
          LIMIT 5
        `);
        topUsers = userMessageCountsResult.rows;
      } catch (error) {
        console.error('Error getting top users:', error);
        // Continue execution even if this query fails
      }
      
      return res.status(200).json({
        success: true,
        stats: {
          messageCount,
          mentionCount,
          topUsers
        }
      });
    } catch (error) {
      console.error('Error getting message stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get message statistics'
      });
    }
  },
  
  /**
   * Get system status and health information
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response with system status
   */
  async getSystemStatus(req, res) {
    try {
      const status = {
        server: {
          status: 'online',
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        },
        database: {
          status: 'disconnected',
          connected: false
        }
      };

      // Test database connection
      try {
        await db.query('SELECT 1');
        status.database.status = 'connected';
        status.database.connected = true;
      } catch (error) {
        console.error('Database connection test failed:', error);
        status.database.status = 'disconnected';
        status.database.connected = false;
        // Do not expose raw error message to callers
      }

      return res.status(200).json({
        success: true,
        status
      });
    } catch (error) {
      console.error('Error getting system status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get system status'
      });
    }
  }
};

module.exports = adminController;
