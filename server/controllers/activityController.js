const db = require("../config/db");

/**
 * Get recent activity logs
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type;
    const since = req.query.since;

    let query = `
      SELECT * 
      FROM activity_log
    `;

    const params = [];
    let paramIndex = 1;
    let whereAdded = false;

    // Add type filter if provided
    if (type) {
      query += ` WHERE activity_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
      whereAdded = true;
    }

    // Add since filter if provided
    if (since) {
      query += whereAdded ? ` AND` : ` WHERE`;
      query += ` created_at > $${paramIndex}`;
      params.push(since);
      paramIndex++;
    }

    // Add order by and limit
    query += `
      ORDER BY created_at DESC
      LIMIT $${paramIndex}
    `;
    params.push(limit);

    const result = await db.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get activity logs for a specific date
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getActivityForDate = async (req, res) => {
  try {
    const { dateString } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    if (!dateString) {
      return res.status(400).json({ message: "dateString is required" });
    }

    const result = await db.query(
      `SELECT * 
       FROM activity_log 
       WHERE date_string = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [dateString, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(
      `Error fetching activity for date ${req.params.dateString}:`,
      error
    );
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getRecentActivity,
  getActivityForDate,
};
