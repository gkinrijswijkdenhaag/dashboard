const db = require("../config/db");

/**
 * Log an activity to the activity_log table
 * @param {Object} client - Database client for transaction
 * @param {Object} activity - Activity details
 * @param {number} activity.userId - User ID
 * @param {string} activity.userName - User name
 * @param {string} activity.userRole - User role
 * @param {string} activity.type - Activity type
 * @param {string} activity.title - Activity title
 * @param {string} activity.description - Activity description
 * @param {string} activity.details - Additional details (optional)
 * @param {string} activity.entityId - Related entity ID (optional)
 * @param {string} activity.dateString - Service date (optional)
 * @param {string} activity.icon - Icon name (optional)
 * @param {string} activity.color - Color name (optional)
 * @returns {Promise<Object>} The created activity log
 */
const logActivity = async (client, activity) => {
  try {
    const result = await client.query(
      `INSERT INTO activity_log 
        (user_id, user_name, user_role, activity_type, title, description, details, entity_id, date_string, icon, color) 
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, created_at`,
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
        activity.icon || "Users",
        activity.color || "purple",
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error("Error logging activity:", error);
    // Don't throw, just log the error - we don't want activity logging to break the main functionality
    return null;
  }
};

/**
 * Get all service assignments
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getAssignments = async (req, res) => {
  try {
    // Get all service assignments with their roles
    const assignmentsQuery = `
      SELECT 
        sa.id,
        sa.date_string,
        sa.title,
        sa.status,
        sa.days_until,
        COALESCE(
          json_agg(
            json_build_object(
              'role', ar.role,
              'person', ar.person
            ) ORDER BY ar.role_order, ar.id
          ) FILTER (WHERE ar.id IS NOT NULL),
          '[]'::json
        ) as assignments
      FROM service_assignments sa
      LEFT JOIN assignment_roles ar ON sa.id = ar.service_assignment_id
      GROUP BY sa.id, sa.date_string, sa.title, sa.status, sa.days_until
      ORDER BY sa.date_string
    `;

    const result = await db.query(assignmentsQuery);

    // Transform the data to match frontend format
    const assignments = result.rows.map((row) => ({
      dateString: row.date_string,
      title: row.title,
      status: row.status,
      daysUntil: row.days_until,
      assignments: row.assignments,
    }));

    res.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Save/Update assignments
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const saveAssignments = async (req, res) => {
  const client = await db.getClient();

  try {
    const { dateString, assignments } = req.body;

    if (!dateString) {
      client.release();
      return res.status(400).json({ message: "dateString is required" });
    }

    if (!assignments || !Array.isArray(assignments)) {
      client.release();
      return res.status(400).json({ message: "Invalid assignments data" });
    }

    await client.query("BEGIN");

    // Use UPSERT approach for the service assignment
    const serviceResult = await client.query(
      `INSERT INTO service_assignments (date_string, title, status, days_until) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (date_string) 
       DO UPDATE SET 
         title = EXCLUDED.title, 
         status = EXCLUDED.status, 
         days_until = EXCLUDED.days_until, 
         updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [dateString, "Sunday Service", "upcoming", 0]
    );

    const serviceId = serviceResult.rows[0].id;

    // Delete existing roles for this service
    await client.query(
      "DELETE FROM assignment_roles WHERE service_assignment_id = $1",
      [serviceId]
    );

    // Insert assignment roles
    for (let i = 0; i < assignments.length; i++) {
      const role = assignments[i];
      await client.query(
        `INSERT INTO assignment_roles (service_assignment_id, role, person, role_order) 
         VALUES ($1, $2, $3, $4)`,
        [serviceId, role.role, role.person || "", i]
      );
    }

    // Log the activity
    if (req.user) {
      const assignedRoles = assignments.filter(
        (role) => role.person && role.person.trim() !== ""
      );
      const assignedPeople = assignedRoles.map(
        (role) => `${role.person} (${role.role})`
      );

      await logActivity(client, {
        userId: req.user.id,
        userName: req.user.username,
        userRole: req.user.role,
        type: "assignment",
        title: "Service Assignments Updated",
        description: `Assignments updated for ${dateString} service`,
        details: assignedPeople.join(", "),
        entityId: serviceId.toString(),
        dateString,
        icon: "Users",
        color: "purple",
      });
    }

    await client.query("COMMIT");
    res.json({ message: "Assignment saved successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error saving assignments:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

/**
 * Update a specific assignment
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const updateAssignment = async (req, res) => {
  const client = await db.getClient();

  try {
    const { dateString } = req.params;
    const { assignments } = req.body;

    if (!dateString || !assignments) {
      client.release();
      return res.status(400).json({ message: "Missing required fields" });
    }

    await client.query("BEGIN");

    try {
      // Use UPSERT for service assignment
      const serviceResult = await client.query(
        `INSERT INTO service_assignments (date_string, title, status, days_until) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (date_string) 
         DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, days_until = EXCLUDED.days_until, updated_at = CURRENT_TIMESTAMP
         RETURNING id`,
        [dateString, "Sunday Service", "upcoming", 0]
      );

      const serviceId = serviceResult.rows[0].id;

      // Delete existing roles for this service
      await client.query(
        "DELETE FROM assignment_roles WHERE service_assignment_id = $1",
        [serviceId]
      );

      // Insert new assignments
      for (let i = 0; i < assignments.length; i++) {
        const assignment = assignments[i];
        await client.query(
          "INSERT INTO assignment_roles (service_assignment_id, role, person, role_order) VALUES ($1, $2, $3, $4)",
          [serviceId, assignment.role, assignment.person || "", i]
        );
      }

      // Log the activity
      if (req.user) {
        const assignedRoles = assignments.filter(
          (assignment) => assignment.person && assignment.person.trim() !== ""
        );
        const assignedPeople = assignedRoles.map(
          (assignment) => `${assignment.person} (${assignment.role})`
        );

        await logActivity(client, {
          userId: req.user.id,
          userName: req.user.username,
          userRole: req.user.role,
          type: "assignment",
          title: "Service Assignments Updated",
          description: `Assignments updated for ${dateString} service`,
          details: assignedPeople.join(", "),
          entityId: serviceId.toString(),
          dateString,
          icon: "Users",
          color: "purple",
        });
      }

      await client.query("COMMIT");
      res.json({ message: "Assignment updated successfully" });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error updating assignment:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

/**
 * Add a new role to a specific service
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const addRole = async (req, res) => {
  const client = await db.getClient();

  try {
    const { dateString } = req.params;
    const { roleName } = req.body;

    if (!dateString || !roleName || !roleName.trim()) {
      client.release();
      return res
        .status(400)
        .json({ message: "Date string and role name are required" });
    }

    await client.query("BEGIN");

    try {
      // Find or create the service assignment
      let serviceResult = await client.query(
        "SELECT id FROM service_assignments WHERE date_string = $1",
        [dateString]
      );

      let serviceId;
      if (serviceResult.rows.length === 0) {
        // Create new service assignment
        const insertResult = await client.query(
          "INSERT INTO service_assignments (date_string, title, status, days_until) VALUES ($1, $2, $3, $4) RETURNING id",
          [dateString, "Sunday Service", "upcoming", 0]
        );
        serviceId = insertResult.rows[0].id;
      } else {
        serviceId = serviceResult.rows[0].id;
      }

      // Get the next role order for this service
      const maxOrderResult = await client.query(
        "SELECT COALESCE(MAX(role_order), -1) + 1 as next_order FROM assignment_roles WHERE service_assignment_id = $1",
        [serviceId]
      );

      const nextOrder = maxOrderResult.rows[0].next_order;

      await client.query(
        "INSERT INTO assignment_roles (service_assignment_id, role, person, role_order) VALUES ($1, $2, $3, $4)",
        [serviceId, roleName.trim(), "", nextOrder]
      );

      await client.query("COMMIT");
      res.json({ message: "Role added successfully" });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error adding role:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

/**
 * Remove a role from a specific service
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const removeRole = async (req, res) => {
  const client = await db.getClient();

  try {
    const { dateString, roleName } = req.params;

    if (!dateString || !roleName) {
      client.release();
      return res
        .status(400)
        .json({ message: "Date string and role name are required" });
    }

    await client.query("BEGIN");

    try {
      // Find the service assignment
      const serviceResult = await client.query(
        "SELECT id FROM service_assignments WHERE date_string = $1",
        [dateString]
      );

      if (serviceResult.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Service assignment not found" });
      }

      const serviceId = serviceResult.rows[0].id;

      // Delete the specific role from this service
      await client.query(
        "DELETE FROM assignment_roles WHERE service_assignment_id = $1 AND role = $2",
        [serviceId, roleName]
      );

      await client.query("COMMIT");
      res.json({ message: "Role removed successfully" });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error removing role:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

/**
 * Reset assignments for a specific date (clear all assignments for that date)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const resetAssignments = async (req, res) => {
  const client = await db.getClient();

  try {
    const { dateString } = req.params;

    if (!dateString) {
      client.release();
      return res.status(400).json({ message: "Date string is required" });
    }

    await client.query("BEGIN");

    try {
      // Find the service assignment
      const serviceResult = await client.query(
        "SELECT id FROM service_assignments WHERE date_string = $1",
        [dateString]
      );

      if (serviceResult.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Service assignment not found" });
      }

      const serviceId = serviceResult.rows[0].id;

      // Delete all assignments for this date (cascade should handle assignment_roles)
      await client.query(
        "DELETE FROM assignment_roles WHERE service_assignment_id = $1",
        [serviceId]
      );
      await client.query("DELETE FROM service_assignments WHERE id = $1", [
        serviceId,
      ]);

      await client.query("COMMIT");
      res.json({ message: "Assignments reset successfully" });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error resetting assignments:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

module.exports = {
  getAssignments,
  saveAssignments,
  updateAssignment,
  addRole,
  removeRole,
  resetAssignments,
};
