const express = require("express");
const router = express.Router();
const lyricsController = require("../controllers/lyricsController");
const { verifyToken } = require("../middleware/auth");

// Get all lyrics that need translation
router.get("/", verifyToken, lyricsController.getLyricsForTranslation);

// Get lyrics for a specific service date
router.get(
  "/:dateString",
  verifyToken,
  lyricsController.getLyricsByServiceDate
);

// Submit new lyrics for translation
router.post("/submit", verifyToken, lyricsController.submitLyrics);

// Submit translation for lyrics
router.post(
  "/translate/:originalId",
  verifyToken,
  lyricsController.submitTranslation
);

// Approve a translation - functionality not used in current implementation
// router.post(
//   "/approve/:translationId",
//   verifyToken,
//   lyricsController.approveTranslation
// );

module.exports = router;
