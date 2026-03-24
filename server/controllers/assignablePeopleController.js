const db = require("../config/db");

/**
 * Get all assignable people
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getAssignablePeople = async (req, res) => {
  try {
    const { activeOnly } = req.query;

    let query = "SELECT * FROM assignable_people";
    const params = [];

    if (activeOnly === "true") {
      query += " WHERE is_active = true";
    }

    query += " ORDER BY name ASC";

    const result = await db.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching assignable people:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get a single assignable person by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getAssignablePersonById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      "SELECT * FROM assignable_people WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Person not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching assignable person:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Create a new assignable person
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const createAssignablePerson = async (req, res) => {
  try {
    const { name, email, roles } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Ensure roles is an array
    const rolesArray = Array.isArray(roles) ? roles : [];

    const result = await db.query(
      `INSERT INTO assignable_people (name, email, roles, is_active) 
       VALUES ($1, $2, $3, true) 
       RETURNING *`,
      [name.trim(), email.trim().toLowerCase(), rolesArray]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating assignable person:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Update an assignable person
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const updateAssignablePerson = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, roles, is_active } = req.body;

    // Check if person exists
    const checkResult = await db.query(
      "SELECT * FROM assignable_people WHERE id = $1",
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Person not found" });
    }

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined && name.trim()) {
      updates.push(`name = $${paramCount}`);
      values.push(name.trim());
      paramCount++;
    }

    if (email !== undefined && email.trim()) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      updates.push(`email = $${paramCount}`);
      values.push(email.trim().toLowerCase());
      paramCount++;
    }

    if (roles !== undefined && Array.isArray(roles)) {
      updates.push(`roles = $${paramCount}`);
      values.push(roles);
      paramCount++;
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(id);

    const result = await db.query(
      `UPDATE assignable_people 
       SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating assignable person:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Delete an assignable person
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const deleteAssignablePerson = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if person exists
    const checkResult = await db.query(
      "SELECT * FROM assignable_people WHERE id = $1",
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Person not found" });
    }

    await db.query("DELETE FROM assignable_people WHERE id = $1", [id]);

    res.json({ message: "Person deleted successfully" });
  } catch (error) {
    console.error("Error deleting assignable person:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Toggle active status of an assignable person
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const toggleAssignablePersonStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE assignable_people 
       SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Person not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error toggling person status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get people by role
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getPeopleByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const { activeOnly } = req.query;

    let query = "SELECT * FROM assignable_people WHERE $1 = ANY(roles)";
    const params = [role];

    if (activeOnly === "true") {
      query += " AND is_active = true";
    }

    query += " ORDER BY name ASC";

    const result = await db.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching people by role:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAssignablePeople,
  getAssignablePersonById,
  createAssignablePerson,
  updateAssignablePerson,
  deleteAssignablePerson,
  toggleAssignablePersonStatus,
  getPeopleByRole,
};
