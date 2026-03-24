const db = require("../config/db");

/**
 * Submit a sermon for translation
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const submitSermon = async (req, res) => {
  const client = await db.getClient();

  try {
    const { dateString, title, documentLink } = req.body;

    if (!dateString || !title || !documentLink) {
      client.release();
      return res.status(400).json({
        message: "dateString, title, and documentLink are required",
      });
    }

    await client.query("BEGIN");

    // Get service_assignment_id for the given date
    let serviceResult = await client.query(
      "SELECT id FROM service_assignments WHERE date_string = $1",
      [dateString]
    );

    let serviceId;

    // If service doesn't exist, create it
    if (serviceResult.rows.length === 0) {
      const newServiceResult = await client.query(
        `INSERT INTO service_assignments (date_string, title, status, days_until) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id`,
        [dateString, "Sunday Service", "upcoming", 0]
      );
      serviceId = newServiceResult.rows[0].id;
    } else {
      serviceId = serviceResult.rows[0].id;
    }

    // Insert the sermon
    const sermonResult = await client.query(
      `INSERT INTO sermon_originals 
       (service_assignment_id, title, document_link, submitted_by, status) 
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, document_link, status, created_at`,
      [serviceId, title, documentLink, req.user.id, "pending"]
    );

    // Update the workflow task status to in-progress
    await client.query(
      `INSERT INTO workflow_tasks (service_assignment_id, task_id, status, document_link, assigned_to) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (service_assignment_id, task_id) 
       DO UPDATE SET 
         status = EXCLUDED.status, 
         document_link = EXCLUDED.document_link,
         updated_at = CURRENT_TIMESTAMP`,
      [serviceId, "sermon", "completed", documentLink, "pastor"]
    );

    await client.query("COMMIT");

    res.json({
      message: "Sermon submitted successfully",
      dateString,
      sermon: sermonResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error submitting sermon:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

/**
 * Submit sermon translation status
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const submitSermonTranslation = async (req, res) => {
  const client = await db.getClient();

  try {
    const { dateString, originalSermonLink, translationComplete, translator } =
      req.body;

    if (
      !dateString ||
      !originalSermonLink ||
      translationComplete === undefined
    ) {
      return res.status(400).json({
        message:
          "dateString, originalSermonLink, and translationComplete are required",
      });
    }

    await client.query("BEGIN");

    // Get service_assignment_id for the given date
    const serviceResult = await client.query(
      "SELECT id FROM service_assignments WHERE date_string = $1",
      [dateString]
    );

    if (serviceResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ message: "Service assignment not found for this date" });
    }

    const serviceId = serviceResult.rows[0].id;

    // Check if sermon original exists, if not create it
    let sermonId;
    const existingSermonResult = await client.query(
      "SELECT id FROM sermon_originals WHERE service_assignment_id = $1 AND document_link = $2",
      [serviceId, originalSermonLink]
    );

    if (existingSermonResult.rows.length === 0) {
      // Create a new sermon original record
      const sermonTitle = "Sermon Document";
      const sermonResult = await client.query(
        `INSERT INTO sermon_originals 
         (service_assignment_id, title, document_link, submitted_by, status) 
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [serviceId, sermonTitle, originalSermonLink, req.user.id, "pending"]
      );
      sermonId = sermonResult.rows[0].id;
    } else {
      sermonId = existingSermonResult.rows[0].id;
    }

    // Check if a translation already exists
    const existingTranslation = await client.query(
      "SELECT id FROM sermon_translations WHERE original_id = $1",
      [sermonId]
    );

    let translationResult;

    if (existingTranslation.rows.length > 0) {
      // Update existing translation
      translationResult = await client.query(
        `UPDATE sermon_translations 
         SET translated_by = $1,
             translated_at = $2,
             status = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE original_id = $4
         RETURNING id, translated_by, translated_at, status, updated_at`,
        [req.user.id, new Date(), "completed", sermonId]
      );
    } else {
      // Insert new translation
      translationResult = await client.query(
        `INSERT INTO sermon_translations 
         (original_id, translated_by, translated_at, status) 
         VALUES ($1, $2, $3, $4)
         RETURNING id, translated_by, translated_at, status, updated_at`,
        [sermonId, req.user.id, new Date(), "completed"]
      );
    }

    // Update original sermon status
    await client.query(
      "UPDATE sermon_originals SET status = $1 WHERE id = $2",
      ["translated", sermonId]
    );

    // Update the workflow task - ensure we update both possible task ID formats
    // First update the hyphen format (this will trigger activity logging)
    await client.query(
      `UPDATE workflow_tasks 
       SET status = 'completed', completed_by = $1, document_link = $2, updated_at = CURRENT_TIMESTAMP
       WHERE service_assignment_id = $3 AND task_id = 'translate-sermon'`,
      [req.user.id, originalSermonLink, serviceId]
    );

    // Then silently update the underscore format without triggering activity logging
    // by using a direct database update instead of going through the workflow controller
    await client.query(
      `INSERT INTO workflow_tasks (service_assignment_id, task_id, status, document_link, completed_by, updated_at) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (service_assignment_id, task_id) 
       DO UPDATE SET 
         status = EXCLUDED.status, 
         document_link = EXCLUDED.document_link,
         completed_by = EXCLUDED.completed_by,
         updated_at = CURRENT_TIMESTAMP`,
      [
        serviceId,
        "translate_sermon",
        "completed",
        originalSermonLink,
        req.user.id,
      ]
    );

    await client.query("COMMIT");

    // Get user information to include in the response
    const userResult = await client.query(
      "SELECT username, avatar_url, role FROM users WHERE id = $1",
      [req.user.id]
    );

    const translatorInfo = userResult.rows[0] || {
      username: translator?.name || "Unknown",
      avatar_url: translator?.avatar || null,
      role: translator?.role || "translator",
    };

    res.json({
      message: "Sermon translation submitted successfully",
      sermonTranslation: {
        ...translationResult.rows[0],
        translator: {
          id: req.user.id,
          name: translatorInfo.username,
          avatar: translatorInfo.avatar_url,
          role: translatorInfo.role,
        },
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error submitting sermon translation:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

/**
 * Get sermon by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getSermonById = async (req, res) => {
  try {
    const { sermonId } = req.params;

    const result = await db.query(
      `SELECT so.*, 
        u.username as submitted_by_name, 
        u.avatar_url as submitted_by_avatar,
        st.id as translation_id,
        st.translated_at,
        st.status as translation_status,
        u2.id as translator_id,
        u2.username as translator_name,
        u2.avatar_url as translator_avatar,
        u2.role as translator_role
      FROM sermon_originals so
      LEFT JOIN users u ON so.submitted_by = u.id
      LEFT JOIN sermon_translations st ON so.id = st.original_id
      LEFT JOIN users u2 ON st.translated_by = u2.id
      WHERE so.id = $1`,
      [sermonId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Sermon not found" });
    }

    const sermon = result.rows[0];

    // Format the response
    const response = {
      id: sermon.id,
      title: sermon.title,
      documentLink: sermon.document_link,
      status: sermon.status,
      createdAt: sermon.created_at,
      updatedAt: sermon.updated_at,
      submittedBy: {
        name: sermon.submitted_by_name,
        avatar: sermon.submitted_by_avatar,
      },
      translation: sermon.translation_id
        ? {
            id: sermon.translation_id,
            translatedAt: sermon.translated_at,
            status: sermon.translation_status,
            translator: {
              id: sermon.translator_id,
              name: sermon.translator_name,
              avatar: sermon.translator_avatar,
              role: sermon.translator_role,
            },
          }
        : null,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching sermon:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get sermons for a specific service date
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getSermonsByDate = async (req, res) => {
  try {
    const { dateString } = req.params;

    // First check if service exists
    const serviceResult = await db.query(
      "SELECT id FROM service_assignments WHERE date_string = $1",
      [dateString]
    );

    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    const serviceId = serviceResult.rows[0].id;

    // Get all sermons for this service
    const sermonsResult = await db.query(
      `SELECT so.*, 
        u.username as submitted_by_name, 
        u.avatar_url as submitted_by_avatar,
        st.id as translation_id,
        st.translated_at,
        st.status as translation_status,
        u2.id as translator_id,
        u2.username as translator_name,
        u2.avatar_url as translator_avatar,
        u2.role as translator_role
      FROM sermon_originals so
      LEFT JOIN users u ON so.submitted_by = u.id
      LEFT JOIN sermon_translations st ON so.id = st.original_id
      LEFT JOIN users u2 ON st.translated_by = u2.id
      WHERE so.service_assignment_id = $1`,
      [serviceId]
    );

    // Format the response
    const sermons = sermonsResult.rows.map((sermon) => ({
      id: sermon.id,
      title: sermon.title,
      documentLink: sermon.document_link,
      status: sermon.status,
      createdAt: sermon.created_at,
      updatedAt: sermon.updated_at,
      submittedBy: {
        name: sermon.submitted_by_name,
        avatar: sermon.submitted_by_avatar,
      },
      translation: sermon.translation_id
        ? {
            id: sermon.translation_id,
            translatedAt: sermon.translated_at,
            status: sermon.translation_status,
            translator: {
              id: sermon.translator_id,
              name: sermon.translator_name,
              avatar: sermon.translator_avatar,
              role: sermon.translator_role,
            },
          }
        : null,
    }));

    res.json({
      dateString,
      sermons,
    });
  } catch (error) {
    console.error(`Error fetching sermons for date ${dateString}:`, error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  submitSermon,
  submitSermonTranslation,
  getSermonById,
  getSermonsByDate,
};
