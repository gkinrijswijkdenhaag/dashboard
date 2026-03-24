const db = require("../config/db");

// Store reference to emitActivityUpdate function (set externally to avoid circular dependency)
let emitActivityUpdateFn = null;

// Setter function to inject the emitActivityUpdate function
const setEmitActivityUpdate = (fn) => {
  emitActivityUpdateFn = fn;
};

// Export the setter
module.exports.setEmitActivityUpdate = setEmitActivityUpdate;

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

    // Emit the activity via WebSocket for real-time updates
    if (
      createdActivity &&
      emitActivityUpdateFn &&
      typeof emitActivityUpdateFn === "function"
    ) {
      try {
        emitActivityUpdateFn(createdActivity);
      } catch (error) {
        console.warn("Error emitting activity update:", error.message);
      }
    }

    return createdActivity;
  } catch (error) {
    console.error("Error logging activity:", error);
    // Don't throw, just log the error - we don't want activity logging to break the main functionality
    return null;
  }
};

/**
 * Get music links for a specific task
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getMusicLinks = async (req, res) => {
  try {
    const { dateString } = req.params;

    if (!dateString) {
      return res.status(400).json({ message: "dateString is required" });
    }

    // Get the workflow task ID for the music task
    const taskResult = await db.query(
      `SELECT wt.id 
       FROM workflow_tasks wt
       JOIN service_assignments sa ON wt.service_assignment_id = sa.id
       WHERE sa.date_string = $1 AND wt.task_id = 'music'`,
      [dateString]
    );

    if (taskResult.rows.length === 0) {
      return res.json({
        dateString,
        musicLinks: [],
      });
    }

    const taskId = taskResult.rows[0].id;

    // Get all music links for this task
    const linksResult = await db.query(
      `SELECT id, name, url, display_order, created_at, updated_at
       FROM music_links
       WHERE workflow_task_id = $1
       ORDER BY display_order ASC, created_at ASC`,
      [taskId]
    );

    res.json({
      dateString,
      musicLinks: linksResult.rows,
    });
  } catch (error) {
    console.error("Error fetching music links:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Save music links for a specific task
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const saveMusicLinks = async (req, res) => {
  const client = await db.getClient();

  try {
    const { dateString } = req.params;
    const { musicLinks, title, notes } = req.body;

    if (!dateString) {
      client.release();
      return res.status(400).json({ message: "dateString is required" });
    }

    if (!musicLinks || !Array.isArray(musicLinks) || musicLinks.length === 0) {
      client.release();
      return res.status(400).json({ message: "musicLinks array is required" });
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

    // Get the primary link (first link) for the workflow_tasks table
    const primaryLink = musicLinks[0].url;

    // Update or insert the music task
    const taskResult = await client.query(
      `INSERT INTO workflow_tasks (service_assignment_id, task_id, status, document_link, assigned_to, completed_by) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (service_assignment_id, task_id) 
       DO UPDATE SET 
         status = EXCLUDED.status, 
         document_link = EXCLUDED.document_link,
         completed_by = CASE WHEN EXCLUDED.status = 'completed' AND workflow_tasks.status != 'completed' THEN $6 ELSE workflow_tasks.completed_by END,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [
        serviceId,
        "music",
        "completed",
        primaryLink,
        "music",
        req.user ? req.user.id : null,
      ]
    );

    const taskId = taskResult.rows[0].id;

    // Delete existing music links for this task
    await client.query(`DELETE FROM music_links WHERE workflow_task_id = $1`, [
      taskId,
    ]);

    // Insert new music links
    for (let i = 0; i < musicLinks.length; i++) {
      const link = musicLinks[i];
      await client.query(
        `INSERT INTO music_links (workflow_task_id, name, url, display_order)
         VALUES ($1, $2, $3, $4)`,
        [taskId, link.name || "", link.url, i]
      );
    }

    // Store additional metadata (title, notes) as JSON in the task metadata
    // This requires adding a metadata column to the workflow_tasks table if it doesn't exist
    try {
      await client.query(
        `ALTER TABLE workflow_tasks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb`
      );

      await client.query(
        `UPDATE workflow_tasks 
         SET metadata = jsonb_build_object('title', $1::text, 'notes', $2::text)
         WHERE id = $3`,
        [title || "", notes || "", taskId]
      );
    } catch (metadataError) {
      console.error("Error adding metadata:", metadataError);
      // Continue even if metadata storage fails
    }

    // Log the activity
    if (req.user) {
      await logActivity(client, {
        userId: req.user.id,
        userName: req.user.username,
        userRole: req.user.role,
        type: "workflow",
        title: "Music Uploaded",
        description: `Music for ${dateString} service`,
        details: `${musicLinks.length} music links uploaded`,
        entityId: "music",
        dateString,
        icon: "Music",
        color: "indigo",
      });
    }

    await client.query("COMMIT");

    res.json({
      message: "Music links saved successfully",
      dateString,
      taskId,
      musicLinks,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error saving music links:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

/**
 * Delete music links for a specific task
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const deleteMusicLinks = async (req, res) => {
  const client = await db.getClient();

  try {
    const { dateString } = req.params;

    if (!dateString) {
      client.release();
      return res.status(400).json({ message: "dateString is required" });
    }

    await client.query("BEGIN");

    // Get the workflow task ID for the music task
    const taskResult = await client.query(
      `SELECT wt.id 
       FROM workflow_tasks wt
       JOIN service_assignments sa ON wt.service_assignment_id = sa.id
       WHERE sa.date_string = $1 AND wt.task_id = 'music'`,
      [dateString]
    );

    if (taskResult.rows.length === 0) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(404).json({ message: "Music task not found" });
    }

    const taskId = taskResult.rows[0].id;

    // Delete all music links for this task
    await client.query(`DELETE FROM music_links WHERE workflow_task_id = $1`, [
      taskId,
    ]);

    // Update the task status to pending
    await client.query(
      `UPDATE workflow_tasks 
       SET status = 'pending', document_link = NULL, metadata = '{}'::jsonb
       WHERE id = $1`,
      [taskId]
    );

    // Log the activity for music deletion
    if (req.user) {
      await logActivity(client, {
        userId: req.user.id,
        userName: req.user.username,
        userRole: req.user.role,
        type: "workflow",
        title: "Music Deleted",
        description: `Music for ${dateString} service deleted`,
        entityId: "music",
        dateString,
        icon: "Trash",
        color: "red",
      });
    }

    await client.query("COMMIT");

    res.json({
      message: "Music links deleted successfully",
      dateString,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting music links:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

module.exports = {
  getMusicLinks,
  saveMusicLinks,
  deleteMusicLinks,
};
