const express = require("express");
const router = express.Router();
const { getEmailHistory, getEmailHistoryByDocument } = require("../controllers/emailHistoryController");
const { verifyToken } = require("../middleware/auth");

// Apply auth middleware to all routes
router.use(verifyToken);

// GET /api/email-history - Get paginated email history
router.get("/", getEmailHistory);

// GET /api/email-history/document/:documentType - Get email history for specific document type
router.get("/document/:documentType", getEmailHistoryByDocument);

module.exports = router;