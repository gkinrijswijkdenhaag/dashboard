const express = require("express");
const router = express.Router();
const musicLinksController = require("../controllers/musicLinksController");
const { verifyToken } = require("../middleware/auth");

// Get music links for a specific service date
router.get("/:dateString", verifyToken, musicLinksController.getMusicLinks);

// Save music links for a specific service date
router.post("/:dateString", verifyToken, musicLinksController.saveMusicLinks);

// Delete music links for a specific service date
router.delete(
  "/:dateString",
  verifyToken,
  musicLinksController.deleteMusicLinks
);

module.exports = router;
