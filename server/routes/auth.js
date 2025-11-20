const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserService = require("../database/userService");

const router = express.Router();

// Input validation helper
const validateLoginInput = (username, password) => {
  const errors = [];

  if (
    !username ||
    typeof username !== "string" ||
    username.trim().length === 0
  ) {
    errors.push("Username is required");
  } else if (username.length < 3 || username.length > 50) {
    errors.push("Username must be between 3 and 50 characters");
  }

  if (!password || typeof password !== "string" || password.length === 0) {
    errors.push("Password is required");
  } else if (password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }

  return errors;
};

// Sanitize username to prevent XSS
const sanitizeUsername = (username) => {
  if (!username || typeof username !== "string") return "";
  // Remove HTML tags and special characters, keep only alphanumeric and basic chars
  return username
    .trim()
    .replace(/[<>\"'&]/g, "")
    .substring(0, 50);
};

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    const errors = validateLoginInput(username, password);
    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0] });
    }

    // Sanitize username
    const sanitizedUsername = sanitizeUsername(username);

    // Find user
    const user = UserService.getUserByUsername(sanitizedUsername);
    if (!user) {
      // Use generic message to prevent username enumeration
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password with timing-safe comparison
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Validate JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in environment variables");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
        issuer: "ielts-exam-system",
      }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    // Don't expose internal errors to client
    res.status(500).json({ message: "An error occurred during login" });
  }
});

module.exports = router;
