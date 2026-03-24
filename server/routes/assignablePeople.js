const express = require("express");
const router = express.Router();
const {
  getAssignablePeople,
  getAssignablePersonById,
  createAssignablePerson,
  updateAssignablePerson,
  deleteAssignablePerson,
  toggleAssignablePersonStatus,
  getPeopleByRole,
} = require("../controllers/assignablePeopleController");
const authMiddleware = require("../middleware/auth");

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied: Admin privileges required",
  });
};

// Get all assignable people (authenticated users can view)
router.get("/", authMiddleware.verifyToken, getAssignablePeople);

// Get people by role (authenticated users can view)
router.get("/by-role/:role", authMiddleware.verifyToken, getPeopleByRole);

// Get a single assignable person by ID (authenticated users can view)
router.get("/:id", authMiddleware.verifyToken, getAssignablePersonById);

// Create a new assignable person (admin only)
router.post("/", authMiddleware.verifyToken, isAdmin, createAssignablePerson);

// Update an assignable person (admin only)
router.put("/:id", authMiddleware.verifyToken, isAdmin, updateAssignablePerson);

// Delete an assignable person (admin only)
router.delete(
  "/:id",
  authMiddleware.verifyToken,
  isAdmin,
  deleteAssignablePerson
);

// Toggle active status (admin only)
router.patch(
  "/:id/toggle",
  authMiddleware.verifyToken,
  isAdmin,
  toggleAssignablePersonStatus
);

module.exports = router;
