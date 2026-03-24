const db = require('../config/db');
const bcrypt = require('bcrypt');

const BCRYPT_ROUNDS = 12;

/**
 * Get all role passcodes
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getAllPasscodes = async (req, res) => {
  try {
    // Only allow admin role to access passcodes
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    }
    
    const result = await db.query('SELECT id, role, created_at, updated_at FROM role_passcodes ORDER BY role');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching passcodes:', error);
    res.status(500).json({ message: 'Server error while fetching passcodes' });
  }
};

/**
 * Update a role passcode
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const updatePasscode = async (req, res) => {
  try {
    const { role, passcode } = req.body;
    
    // Only allow admin role to update passcodes
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    }
    
    // Validate request body
    if (!role || !passcode) {
      return res.status(400).json({ message: 'Role and passcode are required' });
    }
    
    // Check if role exists
    const roleExists = await db.query('SELECT * FROM role_passcodes WHERE role = $1', [role]);
    
    if (roleExists.rows.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    // Hash the new passcode before storing
    const hashedPasscode = await bcrypt.hash(passcode, BCRYPT_ROUNDS);

    // Update passcode
    await db.query('UPDATE role_passcodes SET passcode = $1, updated_at = CURRENT_TIMESTAMP WHERE role = $2', 
      [hashedPasscode, role]);
    
    res.status(200).json({ message: 'Passcode updated successfully' });
  } catch (error) {
    console.error('Error updating passcode:', error);
    res.status(500).json({ message: 'Server error while updating passcode' });
  }
};

module.exports = {
  getAllPasscodes,
  updatePasscode
};
