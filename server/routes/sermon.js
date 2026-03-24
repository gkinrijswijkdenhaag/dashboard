const express = require("express");
const router = express.Router();
const sermonController = require("../controllers/sermonController");
const { verifyToken } = require("../middleware/auth");

// Submit a sermon
router.post("/submit", verifyToken, sermonController.submitSermon);

// Submit a sermon translation
router.post(
  "/translate",
  verifyToken,
  sermonController.submitSermonTranslation
);

// Get sermon by ID
router.get("/:sermonId", verifyToken, sermonController.getSermonById);

// Get sermons for a specific date
router.get("/date/:dateString", verifyToken, sermonController.getSermonsByDate);

module.exports = router;
