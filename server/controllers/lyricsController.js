const db = require("../config/db");

/**
 * Log an activity to the activity_log table
 * @param {Object} client - Database client for transaction
 * @param {Object} activity - Activity details
 * @returns {Promise<Object>} The created activity log
 */
const logActivity = async (client, activity) => {
  try {
    const result = await client.query(
      `INSERT INTO activity_log 
        (user_id, user_name, user_role, activity_type, title, description, details, entity_id, date_string, icon, color) 
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        activity.userId,
        activity.userName,
        activity.userRole,
        activity.type,
        activity.title,
        activity.description,
        activity.details || null,
        activity.entityId || null,
        activity.dateString || null,
        activity.icon || "ArrowRight",
        activity.color || "blue",
      ]
    );

    // Get the created activity with all fields
    const createdActivity = result.rows[0];

    // Activity updates are handled via polling on the frontend
    // No need for real-time WebSocket emission

    return createdActivity;
  } catch (error) {
    console.error("Error logging activity:", error);
    // Don't throw, just log the error - we don't want activity logging to break the main functionality
    return null;
  }
};

/**
 * Get all lyrics that need translation
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getLyricsForTranslation = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        lo.id,
        lo.title,
        lo.lyrics,
        lo.status,
        lo.created_at,
        lo.updated_at,
        sa.date_string,
        u.username as submitted_by_name,
        u.avatar_url as submitted_by_avatar,
        CASE 
          WHEN lt.id IS NOT NULL THEN json_build_object(
            'id', lt.id,
            'translated_title', lt.translated_title,
            'translated_lyrics', lt.translated_lyrics,
            'status', lt.status,
            'translated_by', json_build_object('name', tu.username, 'avatar', tu.avatar_url),
            'updated_at', lt.updated_at
          )
          ELSE NULL
        END as translation
      FROM lyrics_originals lo
      LEFT JOIN service_assignments sa ON lo.service_assignment_id = sa.id
      LEFT JOIN users u ON lo.submitted_by = u.id
      LEFT JOIN lyrics_translations lt ON lo.id = lt.original_id
      LEFT JOIN users tu ON lt.translated_by = tu.id
      ORDER BY lo.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching lyrics for translation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get lyrics for a specific service date
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getLyricsByServiceDate = async (req, res) => {
  try {
    const { dateString } = req.params;

    if (!dateString) {
      return res.status(400).json({ message: "dateString is required" });
    }

    // First get the service_assignment_id for the given date
    const serviceResult = await db.query(
      "SELECT id FROM service_assignments WHERE date_string = $1",
      [dateString]
    );

    // If no service exists yet, return an empty result instead of an error
    if (serviceResult.rows.length === 0) {
      return res.json({
        dateString,
        lyrics: [],
        message: "No service found for this date yet",
      });
    }

    const serviceId = serviceResult.rows[0].id;

    // Get all lyrics for this service
    const result = await db.query(
      `SELECT 
        lo.id,
        lo.title,
        lo.lyrics,
        lo.status,
        lo.created_at,
        lo.updated_at,
        u.username as submitted_by_name,
        u.avatar_url as submitted_by_avatar,
        CASE 
          WHEN lt.id IS NOT NULL THEN json_build_object(
            'id', lt.id,
            'translated_title', lt.translated_title,
            'translated_lyrics', lt.translated_lyrics,
            'status', lt.status,
            'translated_by', json_build_object('name', tu.username, 'avatar', tu.avatar_url),
            'updated_at', lt.updated_at
          )
          ELSE NULL
        END as translation
      FROM lyrics_originals lo
      LEFT JOIN users u ON lo.submitted_by = u.id
      LEFT JOIN lyrics_translations lt ON lo.id = lt.original_id
      LEFT JOIN users tu ON lt.translated_by = tu.id
      WHERE lo.service_assignment_id = $1
      ORDER BY lo.created_at DESC`,
      [serviceId]
    );

    res.json({
      dateString,
      lyrics: result.rows,
    });
  } catch (error) {
    console.error("Error fetching lyrics by service date:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Submit new lyrics for translation
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const submitLyrics = async (req, res) => {
  const client = await db.getClient();

  try {
    const { dateString, songs } = req.body;

    if (!dateString || !songs || !Array.isArray(songs) || songs.length === 0) {
      client.release();
      return res.status(400).json({
        message:
          "dateString and at least one song with title and lyrics are required",
      });
    }

    await client.query("BEGIN");

    // First get or create the service_assignment_id
    const serviceResult = await client.query(
      `INSERT INTO service_assignments (date_string, title, status, days_until) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (date_string) 
       DO UPDATE SET updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [dateString, "Sunday Service", "upcoming", 0]
    );

    const serviceId = serviceResult.rows[0].id;

    // Insert each song
    const insertedSongs = [];
    for (const song of songs) {
      if (!song.title || !song.lyrics) {
        continue; // Skip songs without title or lyrics
      }

      const songResult = await client.query(
        `INSERT INTO lyrics_originals 
         (service_assignment_id, title, lyrics, submitted_by, status) 
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, title, lyrics, status, created_at`,
        [serviceId, song.title, song.lyrics, req.user.id, "pending"]
      );

      insertedSongs.push(songResult.rows[0]);
    }

    // Update workflow task status if any songs were inserted
    if (insertedSongs.length > 0) {
      await client.query(
        `INSERT INTO workflow_tasks (service_assignment_id, task_id, status, assigned_to) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (service_assignment_id, task_id) 
         DO UPDATE SET 
           status = EXCLUDED.status, 
           assigned_to = EXCLUDED.assigned_to,
           updated_at = CURRENT_TIMESTAMP`,
        [serviceId, "translate_lyrics", "in-progress", "translator"]
      );
    }

    // Log activity for adding songs to translate
    if (req.user && insertedSongs.length > 0) {
      await logActivity(client, {
        userId: req.user.id,
        userName: req.user.username,
        userRole: req.user.role,
        type: "lyrics",
        title: "Songs Added for Translation",
        description: `${insertedSongs.length} song(s) added for ${dateString} service`,
        details: insertedSongs.map((song) => song.title).join(", "),
        entityId: "lyrics",
        dateString,
        icon: "Music",
        color: "green",
      });
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Lyrics submitted successfully",
      feedback: `${insertedSongs.length} song(s) have been added for translation. Thank you!`,
      dateString,
      songs: insertedSongs,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error submitting lyrics:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

/**
 * Submit translation for lyrics
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const submitTranslation = async (req, res) => {
  const client = await db.getClient();

  try {
    const { originalId } = req.params;
    const { translatedTitle, translatedLyrics } = req.body;

    if (!originalId || !translatedTitle || !translatedLyrics) {
      client.release();
      return res.status(400).json({
        message:
          "originalId, translatedTitle, and translatedLyrics are required",
      });
    }

    await client.query("BEGIN");

    // Check if the original lyrics exist
    const originalResult = await client.query(
      "SELECT id, service_assignment_id FROM lyrics_originals WHERE id = $1",
      [originalId]
    );

    if (originalResult.rows.length === 0) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(404).json({ message: "Original lyrics not found" });
    }

    const serviceId = originalResult.rows[0].service_assignment_id;

    // First check if a translation already exists
    const existingTranslation = await client.query(
      `SELECT id FROM lyrics_translations WHERE original_id = $1`,
      [originalId]
    );

    let translationResult;

    if (existingTranslation.rows.length > 0) {
      // Update existing translation
      translationResult = await client.query(
        `UPDATE lyrics_translations 
         SET translated_title = $1,
             translated_lyrics = $2,
             translated_by = $3,
             status = $4,
             updated_at = CURRENT_TIMESTAMP
         WHERE original_id = $5
         RETURNING id, translated_title, translated_lyrics, status, updated_at`,
        [
          translatedTitle,
          translatedLyrics,
          req.user.id,
          "completed",
          originalId,
        ]
      );
    } else {
      // Insert new translation
      translationResult = await client.query(
        `INSERT INTO lyrics_translations 
         (original_id, translated_title, translated_lyrics, translated_by, status) 
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, translated_title, translated_lyrics, status, updated_at`,
        [
          originalId,
          translatedTitle,
          translatedLyrics,
          req.user.id,
          "completed",
        ]
      );
    }

    // Update original lyrics status
    await client.query(
      "UPDATE lyrics_originals SET status = $1 WHERE id = $2",
      ["translated", originalId]
    );

    // Check if all lyrics for this service are translated
    const pendingResult = await client.query(
      "SELECT COUNT(*) FROM lyrics_originals WHERE service_assignment_id = $1 AND status != 'translated'",
      [serviceId]
    );

    // If all lyrics are translated, update the workflow task
    if (parseInt(pendingResult.rows[0].count) === 0) {
      await client.query(
        `UPDATE workflow_tasks 
         SET status = 'completed', completed_by = $1, updated_at = CURRENT_TIMESTAMP
         WHERE service_assignment_id = $2 AND task_id = 'translate_lyrics'`,
        [req.user.id, serviceId]
      );

      // Get the service date for the activity log
      const serviceDateResult = await client.query(
        "SELECT date_string FROM service_assignments WHERE id = $1",
        [serviceId]
      );

      const dateString =
        serviceDateResult.rows.length > 0
          ? serviceDateResult.rows[0].date_string
          : null;

      // Log activity for completing all translations
      if (req.user && dateString) {
        await logActivity(client, {
          userId: req.user.id,
          userName: req.user.username,
          userRole: req.user.role,
          type: "workflow",
          title: "All Songs Translated",
          description: `All songs for ${dateString} service have been translated`,
          entityId: "translate_lyrics",
          dateString,
          icon: "CheckCircle",
          color: "green",
        });
      }
    }

    // Get the original song title for the activity log
    const originalSongResult = await client.query(
      "SELECT title FROM lyrics_originals WHERE id = $1",
      [originalId]
    );

    const songTitle =
      originalSongResult.rows.length > 0
        ? originalSongResult.rows[0].title
        : "Unknown song";

    // Get the service date for the activity log
    const serviceDateResult = await client.query(
      "SELECT sa.date_string FROM service_assignments sa JOIN lyrics_originals lo ON sa.id = lo.service_assignment_id WHERE lo.id = $1",
      [originalId]
    );

    const dateString =
      serviceDateResult.rows.length > 0
        ? serviceDateResult.rows[0].date_string
        : null;

    // Log activity for completing song translation
    if (req.user) {
      await logActivity(client, {
        userId: req.user.id,
        userName: req.user.username,
        userRole: req.user.role,
        type: "lyrics",
        title: "Song Translation Completed",
        description: `Translation completed for "${songTitle}"`,
        details: `Original song: "${songTitle}"\nTranslated title: "${translatedTitle}"`,
        entityId: originalId,
        dateString,
        icon: "FileText",
        color: "green",
      });
    }

    await client.query("COMMIT");

    // Get the count of remaining untranslated songs
    const remainingResult = await client.query(
      "SELECT COUNT(*) FROM lyrics_originals WHERE service_assignment_id = $1 AND status != 'translated'",
      [serviceId]
    );

    const remainingCount = parseInt(remainingResult.rows[0].count);

    // Create a feedback message based on whether all songs are translated or not
    let feedbackMessage;
    if (remainingCount === 0) {
      feedbackMessage = `Great job! Translation for "${songTitle}" has been saved. All songs for this service have been translated!`;
    } else {
      feedbackMessage = `Translation for "${songTitle}" has been saved. ${remainingCount} song(s) still need translation.`;
    }

    res.json({
      message: "Translation submitted successfully",
      feedback: feedbackMessage,
      translation: translationResult.rows[0],
      remainingCount,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error submitting translation:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

/**
 * Approve a translation - functionality not used in current implementation
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
// const approveTranslation = async (req, res) => {
//   const client = await db.getClient();

//   try {
//     const { translationId } = req.params;

//     if (!translationId) {
//       return res.status(400).json({ message: "translationId is required" });
//     }

//     await client.query("BEGIN");

//     // Update translation status
//     const result = await client.query(
//       `UPDATE lyrics_translations
//        SET status = 'approved', approved_by = $1, updated_at = CURRENT_TIMESTAMP
//        WHERE id = $2
//        RETURNING id, status, updated_at`,
//       [req.user.id, translationId]
//     );

//     if (result.rows.length === 0) {
//       await client.query("ROLLBACK");
//       return res.status(404).json({ message: "Translation not found" });
//     }

//     await client.query("COMMIT");

//     res.json({
//       message: "Translation approved successfully",
//       translation: result.rows[0],
//     });
//   } catch (error) {
//     await client.query("ROLLBACK");
//     console.error("Error approving translation:", error);
//     res.status(500).json({ message: "Internal server error" });
//   } finally {
//     client.release();
//   }
// };

module.exports = {
  getLyricsForTranslation,
  getLyricsByServiceDate,
  submitLyrics,
  submitTranslation,
  // approveTranslation, // Not used in current implementation
};
