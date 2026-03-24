const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

/**
 * Admin routes
 * All routes are protected by authentication middleware and require admin role
 */

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied: Admin privileges required'
  });
};

// Apply authentication middleware to all routes
router.use(authMiddleware.verifyToken);
router.use(isAdmin);

// Clear all messages and related data
router.post('/clear-messages', adminController.clearAllMessages);

// Get message statistics
router.get('/message-stats', adminController.getMessageStats);

// Get system status
router.get('/system-status', adminController.getSystemStatus);

module.exports = router;
