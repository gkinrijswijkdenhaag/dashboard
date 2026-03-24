const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const profileController = require('../controllers/profileController');

// All profile routes require authentication
router.use(verifyToken);

// GET /api/profile - Get current user's profile
router.get('/', profileController.getProfile);

// PUT /api/profile - Update current user's profile
router.put('/', profileController.updateProfile);

module.exports = router;