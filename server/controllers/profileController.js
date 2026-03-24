const db = require("../config/db");

/**
 * Get user profile information
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      "SELECT id, username, role, email, avatar_url, created_at, last_active FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error while fetching profile" });
  }
};

/**
 * Update user profile information
 * NOTE: Email is now managed per role by admin, not by individual users
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username } = req.body;

    // Users can only update their username, not email
    // Email is managed per role by admin

    if (!username || !username.trim()) {
      return res.status(400).json({ message: "Username is required" });
    }

    const query = `
      UPDATE users 
      SET username = $1, last_active = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING id, username, role, email, avatar_url, created_at, last_active
    `;

    const result = await db.query(query, [username.trim(), userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating user profile:", error);

    // Handle unique constraint violations
    if (error.code === "23505") {
      return res.status(409).json({ message: "Username already exists" });
    }

    res.status(500).json({ message: "Server error while updating profile" });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
