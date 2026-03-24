const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");
const authMiddleware = require("../middleware/auth");

/**
 * Activity routes
 * All routes are protected by authentication middleware
 */

// Apply authentication middleware to all routes
router.use(authMiddleware.verifyToken);

// Get recent activity logs
router.get("/", activityController.getRecentActivity);

// Get activity logs for a specific date
router.get("/date/:dateString", activityController.getActivityForDate);

module.exports = router;
