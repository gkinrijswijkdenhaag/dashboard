const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  getAssignments,
  saveAssignments,
  updateAssignment,
  addRole,
  removeRole,
  resetAssignments
} = require('../controllers/assignmentsController');

// Get all assignments
router.get('/', verifyToken, getAssignments);

// Save/Update assignments for a specific date
router.post('/', verifyToken, saveAssignments);

// Update a specific assignment
router.put('/:dateString', verifyToken, updateAssignment);

// Add a role to a specific assignment
router.post('/:dateString/roles', verifyToken, addRole);

// Remove a role from a specific assignment
router.delete('/:dateString/roles/:roleName', verifyToken, removeRole);

// Reset assignments for a specific date
router.delete('/:dateString/reset', verifyToken, resetAssignments);

module.exports = router;