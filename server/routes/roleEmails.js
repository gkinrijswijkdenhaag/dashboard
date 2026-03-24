const express = require("express");
const router = express.Router();
const roleEmailsController = require("../controllers/roleEmailsController");
const { verifyToken } = require("../middleware/auth");

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get all role emails (admin only)
router.get("/", roleEmailsController.getAllRoleEmails);

// Get email for current user's role
router.get("/my-role", roleEmailsController.getMyRoleEmail);

// Get email for specific role
router.get("/:role", roleEmailsController.getRoleEmail);

// Update a single role email (admin only)
router.put("/", roleEmailsController.updateRoleEmail);

// Update multiple role emails at once (admin only)
router.put("/batch", roleEmailsController.updateMultipleRoleEmails);

module.exports = router;
