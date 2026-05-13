const db = require("../config/db");

/**
 * Get all default roles ordered by role_order
 */
const getDefaultRoles = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, role_order FROM default_roles ORDER BY role_order, id"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching default roles:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Add a new default role
 */
const addDefaultRole = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Role name is required" });
    }

    // Set order to the end of the list
    const orderResult = await db.query(
      "SELECT COALESCE(MAX(role_order), 0) + 1 AS next_order FROM default_roles"
    );
    const nextOrder = orderResult.rows[0].next_order;

    const result = await db.query(
      "INSERT INTO default_roles (name, role_order) VALUES ($1, $2) RETURNING id, name, role_order",
      [name.trim(), nextOrder]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "A role with this name already exists" });
    }
    console.error("Error adding default role:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Delete a default role by id
 */
const deleteDefaultRole = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      "DELETE FROM default_roles WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error("Error deleting default role:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getDefaultRoles, addDefaultRole, deleteDefaultRole };
