const express = require('express');
const router = express.Router();
const passcodeController = require('../controllers/passcodeController');
const authMiddleware = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authMiddleware.verifyToken);

// Get all passcodes (restricted to admin/treasurer)
router.get('/', passcodeController.getAllPasscodes);

// Update a passcode (restricted to admin/treasurer)
router.put('/', passcodeController.updatePasscode);

module.exports = router;
