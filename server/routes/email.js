const express = require("express");
const router = express.Router();
const { sendEmail } = require("../controllers/emailController");
const { verifyToken } = require("../middleware/auth");

// Apply auth middleware to all routes
router.use(verifyToken);

// POST /api/email/send - Send an email
router.post("/send", sendEmail);

module.exports = router;
