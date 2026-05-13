const express = require("express");
const router = express.Router();
const { verifyToken, checkRole } = require("../middleware/auth");
const {
  getDefaultRoles,
  addDefaultRole,
  deleteDefaultRole,
} = require("../controllers/defaultRolesController");

// Get all default roles (any authenticated user)
router.get("/", verifyToken, getDefaultRoles);

// Add a default role (admin only)
router.post("/", verifyToken, checkRole(["admin"]), addDefaultRole);

// Delete a default role (admin only)
router.delete("/:id", verifyToken, checkRole(["admin"]), deleteDefaultRole);

module.exports = router;
