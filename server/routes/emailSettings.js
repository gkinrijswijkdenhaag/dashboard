const express = require('express');
const router = express.Router();
const emailSettingsController = require('../controllers/emailSettingsController');
const authMiddleware = require('../middleware/auth');

/**
 * Email Settings routes
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

// Get email settings
router.get('/', emailSettingsController.getEmailSettings);

// Update email settings
router.put('/', emailSettingsController.updateEmailSettings);

// Test email configuration
router.post('/test', emailSettingsController.testEmailSettings);

module.exports = router;