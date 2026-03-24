const db = require("../config/db");

/**
 * Get all role emails (admin only)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getAllRoleEmails = async (req, res) => {
  try {
    // Only allow admin role to access role emails
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied: Admin privileges required" });
    }

    const result = await db.query(
      "SELECT id, role, email, created_at, updated_at FROM role_emails ORDER BY role"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching role emails:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching role emails" });
  }
};

/**
 * Get email for a specific role (any authenticated user)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getRoleEmail = async (req, res) => {
  try {
    const { role } = req.params;

    const result = await db.query(
      "SELECT role, email FROM role_emails WHERE role = $1",
      [role]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching role email:", error);
    res.status(500).json({ message: "Server error while fetching role email" });
  }
};

/**
 * Get email for current user's role
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getMyRoleEmail = async (req, res) => {
  try {
    const userRole = req.user.role;

    const result = await db.query(
      "SELECT role, email FROM role_emails WHERE role = $1",
      [userRole]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching role email:", error);
    res.status(500).json({ message: "Server error while fetching role email" });
  }
};

/**
 * Update a role's email (admin only)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const updateRoleEmail = async (req, res) => {
  try {
    const { role, email } = req.body;

    // Only allow admin role to update role emails
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied: Admin privileges required" });
    }

    // Validate request body
    if (!role) {
      return res.status(400).json({ message: "Role is required" });
    }

    // Email can be empty string, but if provided, validate format
    if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check if role exists
    const roleExists = await db.query(
      "SELECT * FROM role_emails WHERE role = $1",
      [role]
    );

    if (roleExists.rows.length === 0) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Update email
    await db.query(
      "UPDATE role_emails SET email = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP WHERE role = $3",
      [email || "", req.user.id, role]
    );

    res.status(200).json({
      message: "Role email updated successfully",
      role,
      email: email || "",
    });
  } catch (error) {
    console.error("Error updating role email:", error);
    res.status(500).json({ message: "Server error while updating role email" });
  }
};

/**
 * Update multiple role emails at once (admin only)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const updateMultipleRoleEmails = async (req, res) => {
  try {
    const { roleEmails } = req.body; // Array of { role, email }

    // Only allow admin role to update role emails
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied: Admin privileges required" });
    }

    if (!Array.isArray(roleEmails)) {
      return res.status(400).json({ message: "roleEmails must be an array" });
    }

    // Validate all emails first
    for (const item of roleEmails) {
      if (!item.role) {
        return res.status(400).json({ message: "Each item must have a role" });
      }
      if (
        item.email &&
        item.email.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)
      ) {
        return res
          .status(400)
          .json({ message: `Invalid email format for role: ${item.role}` });
      }
    }

    // Update all emails in a transaction
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      for (const item of roleEmails) {
        await client.query(
          "UPDATE role_emails SET email = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP WHERE role = $3",
          [item.email || "", req.user.id, item.role]
        );
      }

      await client.query("COMMIT");

      res.status(200).json({
        message: "Role emails updated successfully",
        updated: roleEmails.length,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating multiple role emails:", error);
    res
      .status(500)
      .json({ message: "Server error while updating role emails" });
  }
};

/**
 * Internal function to get role email (for use within controllers)
 * @param {string} role - Role name
 * @returns {Promise<Object|null>} Role email object or null
 */
const getRoleEmailInternal = async (role) => {
  try {
    const result = await db.query(
      "SELECT role, email FROM role_emails WHERE role = $1",
      [role]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error fetching role email internally:", error);
    return null;
  }
};

module.exports = {
  getAllRoleEmails,
  getRoleEmail,
  getMyRoleEmail,
  updateRoleEmail,
  updateMultipleRoleEmails,
  getRoleEmailInternal,
};
