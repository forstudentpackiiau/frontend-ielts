const express = require("express");
const bcrypt = require("bcryptjs");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const UserService = require("../database/userService");

const router = express.Router();

// Get all users (admin only)
router.get("/", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const users = UserService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get specific user (admin only)
router.get("/:id", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const user = UserService.getUserById(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create user (admin only)
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { username, password, role, assignedTests } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = UserService.createUser(
      username,
      hashedPassword,
      role || "user",
      assignedTests || []
    );

    res.status(201).json(newUser);
  } catch (error) {
    if (error.message === "Username already exists") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update user (admin only)
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { username, password, role, assignedTests } = req.body;
    const userId = parseInt(req.params.id);

    const updateData = { username, role, assigned_tests: assignedTests };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = UserService.updateUser(userId, updateData);
    res.json(updatedUser);
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete user (admin only)
router.delete("/:id", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const deleted = UserService.deleteUser(userId);

    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Assign test to user (admin only)
router.post("/:id/assign-test", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { testId } = req.body;

    const user = UserService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.assigned_tests.includes(testId)) {
      user.assigned_tests.push(testId);
      UserService.updateUser(userId, { assigned_tests: user.assigned_tests });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
