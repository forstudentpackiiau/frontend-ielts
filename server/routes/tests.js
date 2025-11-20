const express = require("express");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const {
  getTestData,
  getTestsList,
  getAllTests,
  updateTestActivation,
} = require("../data/tests");
const UserService = require("../database/userService");

const router = express.Router();

// Get all tests organized by section (admin only - includes answers)
router.get("/all", authMiddleware, adminMiddleware, (req, res) => {
  const tests = getTestsList();
  res.json(tests);
});

// Update test activation status (admin only)
router.patch(
  "/:testId/activate",
  authMiddleware,
  adminMiddleware,
  (req, res) => {
    const { testId } = req.params;
    const { activated } = req.body;

    if (typeof activated !== "boolean") {
      return res
        .status(400)
        .json({ message: "activated field must be a boolean" });
    }

    const result = updateTestActivation(testId, activated);

    if (result.success) {
      res.json({ message: result.message, activated });
    } else {
      res.status(400).json({ message: result.message });
    }
  }
);

// Get user's assigned tests
router.get("/assigned", authMiddleware, (req, res) => {
  try {
    const allTests = getTestsList();
    const assignedTests = {
      listening: null,
      reading: null,
      writing: null,
    };

    // Return all activated tests for users (no need for assignment)
    // Admin has already activated which tests should be available
    ["listening", "reading", "writing"].forEach((section) => {
      const sectionTests = allTests[section] || [];
      // Find the activated test in this section
      const activeTest = sectionTests.find((test) => test.activated);

      if (activeTest) {
        assignedTests[section] = {
          id: activeTest.id,
          title: activeTest.title,
          section: activeTest.section,
          duration: activeTest.duration,
          total_questions: activeTest.total_questions,
        };
      }
    });

    res.json(assignedTests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get specific test (without answers for users)
router.get("/:testId", authMiddleware, (req, res) => {
  const { testId } = req.params;
  const test = getTestData(testId);

  if (!test) {
    return res.status(404).json({ message: "Test not found" });
  }

  // For regular users, check if test is activated
  if (req.user.role !== "admin") {
    // Check if test is activated
    if (!test.activated) {
      return res
        .status(403)
        .json({ message: "This test is currently not available." });
    }

    // Remove answers from test data for users
    const { answers, ...testWithoutAnswers } = test;
    return res.json(testWithoutAnswers);
  }

  // Admin gets full test data
  res.json(test);
});

module.exports = router;
