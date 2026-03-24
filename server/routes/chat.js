const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middleware/auth');

// All chat routes require authentication
router.use(verifyToken);

// Get recent messages
router.get('/messages', chatController.getMessages);

// Create a new message
router.post('/messages', chatController.createMessage);

// Get mentions for current user
router.get('/mentions', chatController.getMentions);

// Mark mentions as read
router.post('/mentions/read', chatController.markMentionsAsRead);

// Get unread mention count
router.get('/mentions/unread', chatController.getUnreadMentionCount);

module.exports = router;
