const express = require("express");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const SubmissionService = require("../database/submissionService");
const CombinedSubmissionService = require("../database/combinedSubmissionService");
const { getTestData } = require("../data/tests");
const { assessWriting, countWords } = require("../services/writingAssessment");
const { generateExamPDF } = require("../services/pdfGenerator");

const router = express.Router();

// Calculate band score based on correct answers
function calculateBandScore(correctCount, totalQuestions) {
  const percentage = (correctCount / totalQuestions) * 100;

  if (percentage >= 97.5) return 9.0;
  if (percentage >= 95) return 8.5;
  if (percentage >= 90) return 8.0;
  if (percentage >= 85) return 7.5;
  if (percentage >= 80) return 7.0;
  if (percentage >= 70) return 6.5;
  if (percentage >= 60) return 6.0;
  if (percentage >= 50) return 5.5;
  if (percentage >= 40) return 5.0;
  if (percentage >= 30) return 4.5;
  if (percentage >= 20) return 4.0;
  return 3.5;
}

// Compare answers
function compareAnswers(userAnswer, correctAnswer) {
  if (Array.isArray(correctAnswer)) {
    if (Array.isArray(userAnswer)) {
      return (
        correctAnswer.every((ans) => userAnswer.includes(ans)) &&
        userAnswer.every((ans) => correctAnswer.includes(ans))
      );
    }
    return correctAnswer.includes(userAnswer);
  }

  if (Array.isArray(userAnswer)) {
    return userAnswer.includes(correctAnswer);
  }

  return (
    String(userAnswer).trim().toLowerCase() ===
    String(correctAnswer).trim().toLowerCase()
  );
}

// Submit test answers
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { testId, answers, timeSpent } = req.body;
    const userId = req.user.id;

    // Get test data
    const test = getTestData(testId);
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    // Check if this is a writing test
    if (test.section === "writing") {
      return handleWritingSubmission(
        req,
        res,
        userId,
        testId,
        answers,
        timeSpent,
        test
      );
    }

    // Handle listening/reading tests (existing logic)
    return handleStandardSubmission(
      req,
      res,
      userId,
      testId,
      answers,
      timeSpent,
      test
    );
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Handle writing test submission with AI assessment
async function handleWritingSubmission(
  req,
  res,
  userId,
  testId,
  answers,
  timeSpent,
  test
) {
  try {
    const task1Text = answers.task1 || "";
    const task2Text = answers.task2 || "";

    const task1WordCount = countWords(task1Text);
    const task2WordCount = countWords(task2Text);

    // Assess both tasks using AI
    const task1Assessment = await assessWriting(
      task1Text,
      "task1",
      task1WordCount
    );
    const task2Assessment = await assessWriting(
      task2Text,
      "task2",
      task2WordCount
    );

    // Calculate overall band score (Task 2 weighs more: Task 1 = 1/3, Task 2 = 2/3)
    const overallBand =
      Math.round(
        ((task1Assessment.overallBand * 1 + task2Assessment.overallBand * 2) /
          3) *
          2
      ) / 2;

    // Save to database with assessment results
    const savedSubmission = SubmissionService.createSubmission(
      userId,
      testId,
      {
        answers: {
          task1: task1Text,
          task2: task2Text,
        },
        assessment: {
          task1: task1Assessment,
          task2: task2Assessment,
          overallBand: overallBand,
        },
      },
      null, // No correctCount for writing
      2, // 2 tasks
      timeSpent
    );

    // Also save to combined submissions
    const writingData = {
      testId: testId,
      bandScore: overallBand,
      timeSpent: timeSpent,
      answers: {
        task1: task1Text,
        task2: task2Text,
      },
      assessment: {
        task1: task1Assessment,
        task2: task2Assessment,
        overallBand: overallBand,
      },
    };
    CombinedSubmissionService.createOrUpdateCombinedSubmission(
      userId,
      writingData,
      "writing"
    );

    res.json({
      id: savedSubmission.id,
      testId: testId,
      overallBand: overallBand,
      task1: {
        wordCount: task1WordCount,
        band: task1Assessment.overallBand,
        feedback: task1Assessment.feedback,
        criteria: {
          taskAchievement: task1Assessment.taskAchievement,
          coherenceCohesion: task1Assessment.coherenceCohesion,
          lexicalResource: task1Assessment.lexicalResource,
          grammaticalRange: task1Assessment.grammaticalRange,
        },
      },
      task2: {
        wordCount: task2WordCount,
        band: task2Assessment.overallBand,
        feedback: task2Assessment.feedback,
        criteria: {
          taskAchievement: task2Assessment.taskAchievement,
          coherenceCohesion: task2Assessment.coherenceCohesion,
          lexicalResource: task2Assessment.lexicalResource,
          grammaticalRange: task2Assessment.grammaticalRange,
        },
      },
      submittedAt: savedSubmission.submitted_at,
    });
  } catch (error) {
    throw error;
  }
}

// Handle standard (listening/reading) test submission
function handleStandardSubmission(
  req,
  res,
  userId,
  testId,
  answers,
  timeSpent,
  test
) {
  try {
    const { testId: tid, answers: ans } = req.body;

    // Calculate score - include ALL questions from test
    const results = {};
    let correctCount = 0;

    // Identify Multiple Selection questions (where answers should be checked as a set)
    const multipleSelectionRanges = new Set();
    if (test.passages) {
      test.passages.forEach((passage) => {
        if (passage.questions) {
          Object.values(passage.questions).forEach((questionGroup) => {
            if (
              questionGroup.type === "Multiple Selection" &&
              questionGroup.items &&
              questionGroup.items[0] &&
              questionGroup.items[0].number
            ) {
              multipleSelectionRanges.add(questionGroup.items[0].number);
            }
          });
        }
      });
    }

    // Calculate total questions from answers object
    // Count multi-answer questions (like "25-26") as 2 questions
    let totalQuestions = 0;
    Object.keys(test.answers).forEach((qId) => {
      if (qId.includes("-")) {
        const [q1, q2] = qId.split("-").map(Number);
        totalQuestions += q2 - q1 + 1;
      } else {
        totalQuestions += 1;
      }
    });

    // Track which questions have been processed (for Multiple Selection)
    const processedQuestions = new Set();

    // Loop through ALL questions in the test (not just answered ones)
    Object.keys(test.answers).forEach((questionId) => {
      // Skip if this question was already processed as part of Multiple Selection
      if (processedQuestions.has(questionId)) {
        return;
      }

      let userAnswer = answers[questionId];
      let correctAnswer = test.answers[questionId];
      let isCorrect = false;

      // Check if this is part of a Multiple Selection range
      let isMultipleSelection = false;
      let multipleSelectionRange = null;
      for (const range of multipleSelectionRanges) {
        const [start, end] = range.split("-").map(Number);
        const qNum = parseInt(questionId);
        if (qNum >= start && qNum <= end) {
          isMultipleSelection = true;
          multipleSelectionRange = range;
          break;
        }
      }

      if (isMultipleSelection && multipleSelectionRange) {
        // Handle Multiple Selection - check all answers in range as a set
        const [q1, q2] = multipleSelectionRange.split("-").map(Number);
        const userAnswers = [];
        const correctAnswers = [];

        // Collect all user answers and correct answers in the range
        for (let i = q1; i <= q2; i++) {
          if (answers[i]) {
            userAnswers.push(answers[i]);
          }
          if (test.answers[i]) {
            correctAnswers.push(test.answers[i]);
          }
          processedQuestions.add(i.toString());
        }

        // Check if sets match (order doesn't matter)
        const setsMatch =
          userAnswers.length === correctAnswers.length &&
          userAnswers.every((ans) => correctAnswers.includes(ans)) &&
          correctAnswers.every((ans) => userAnswers.includes(ans));

        // Mark all questions in range with the same result
        for (let i = q1; i <= q2; i++) {
          if (setsMatch) correctCount++;
          results[i] = {
            userAnswer: answers[i] || null,
            isCorrect: setsMatch,
          };
        }
      } else if (questionId.includes("-")) {
        // Handle multi-answer questions (e.g., "25-26": "C,E")
        const [q1, q2] = questionId.split("-").map(Number);
        const userAnswers = [answers[q1], answers[q2]].filter(Boolean);
        const correctAnswers = correctAnswer.split(",").map((a) => a.trim());

        // Check if user provided both answers and they match the correct ones
        isCorrect =
          userAnswers.length === correctAnswers.length &&
          correctAnswers.every((ans) => userAnswers.includes(ans)) &&
          userAnswers.every((ans) => correctAnswers.includes(ans));

        userAnswer = userAnswers.join(", ") || null;

        if (isCorrect) correctCount++;

        results[questionId] = {
          userAnswer: userAnswer || null,
          isCorrect,
        };
      } else {
        // Check if correct answer is an array (multi-input same question)
        if (Array.isArray(correctAnswer)) {
          // User answer should also be an array
          if (Array.isArray(userAnswer)) {
            // Check as set - order doesn't matter, both values must be present
            const setsMatch =
              userAnswer.length === correctAnswer.length &&
              userAnswer.every((ans) =>
                correctAnswer.some((correct) => compareAnswers(ans, correct))
              ) &&
              correctAnswer.every((correct) =>
                userAnswer.some((ans) => compareAnswers(ans, correct))
              );
            isCorrect = setsMatch;
          } else {
            isCorrect = false; // User didn't provide array answer
          }

          if (isCorrect) correctCount++;

          results[questionId] = {
            userAnswer: userAnswer || null,
            isCorrect,
          };
        } else {
          // Regular single-answer question
          isCorrect = userAnswer
            ? compareAnswers(userAnswer, correctAnswer)
            : false;

          if (isCorrect) correctCount++;

          results[questionId] = {
            userAnswer: userAnswer || null,
            isCorrect,
          };
        }
      }
    });

    const bandScore = calculateBandScore(correctCount, totalQuestions);

    // Save to database
    const savedSubmission = SubmissionService.createSubmission(
      userId,
      testId,
      {
        answers,
        results,
        bandScore,
      },
      correctCount,
      totalQuestions,
      timeSpent
    );

    // Also save to combined submissions
    const section = test.section; // "listening" or "reading"
    const sectionData = {
      testId: testId,
      correctCount: correctCount,
      totalQuestions: totalQuestions,
      bandScore: bandScore,
      timeSpent: timeSpent,
      answers: answers,
      results: results,
    };
    CombinedSubmissionService.createOrUpdateCombinedSubmission(
      userId,
      sectionData,
      section
    );

    // Send back results without correct answers
    res.json({
      id: savedSubmission.id,
      correctCount,
      totalQuestions: totalQuestions,
      bandScore,
      results: Object.keys(results).reduce((acc, qId) => {
        acc[qId] = { isCorrect: results[qId].isCorrect };
        return acc;
      }, {}),
      submittedAt: savedSubmission.submitted_at,
    });
  } catch (error) {
    throw error;
  }
}

// Get user's submissions
router.get("/my-submissions", authMiddleware, (req, res) => {
  try {
    const submissions = SubmissionService.getSubmissionsByUserId(req.user.id);
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all submissions (admin only)
router.get("/all", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const submissions = SubmissionService.getAllSubmissions();

    // Transform database format to frontend format
    const transformedSubmissions = submissions.map((submission) => {
      const parsedAnswers = submission.answers;

      // Get band score - for writing tests it's in assessment.overallBand
      let bandScore = parsedAnswers.bandScore;
      if (parsedAnswers.assessment && parsedAnswers.assessment.overallBand) {
        bandScore = parsedAnswers.assessment.overallBand;
      }

      return {
        id: submission.id,
        userId: submission.user_id,
        username: submission.username,
        testId: submission.test_id,
        correctCount: submission.score,
        totalQuestions: submission.total_questions,
        bandScore: bandScore,
        timeSpent: submission.time_spent,
        submittedAt: submission.submitted_at,
      };
    });

    res.json(transformedSubmissions);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get specific submission with detailed results (admin only)
router.get("/:id", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const submissionId = parseInt(req.params.id);
    console.log(`[GET /:id] Fetching submission ID: ${submissionId}`);

    const submission = SubmissionService.getSubmissionById(submissionId);

    if (!submission) {
      console.log(`[GET /:id] Submission ${submissionId} not found`);
      return res.status(404).json({ message: "Submission not found" });
    }

    console.log(`[GET /:id] Found submission:`, submission.test_id);

    // Get test data to include correct answers
    const test = getTestData(submission.test_id);

    if (!test) {
      console.log(`[GET /:id] Test data not found for: ${submission.test_id}`);
      return res.status(404).json({ message: "Test data not found" });
    }

    console.log(`[GET /:id] Test section: ${test.section}`);

    const parsedAnswers = submission.answers;

    // Check if this is a writing test
    if (test.section === "writing") {
      console.log(`[GET /:id] Returning writing test assessment`);
      // For writing tests, return the assessment results
      return res.json({
        id: submission.id,
        userId: submission.user_id,
        username: submission.username,
        testId: submission.test_id,
        totalQuestions: submission.total_questions,
        bandScore: parsedAnswers.assessment?.overallBand || submission.score,
        timeSpent: submission.time_spent,
        submittedAt: submission.submitted_at,
        answers: parsedAnswers, // Contains both answers and assessment
      });
    }

    // For listening/reading tests, continue with existing logic
    if (!test.answers) {
      return res.status(404).json({ message: "Test answers not found" });
    }

    const results = parsedAnswers.results || {};

    // Build detailed results for ALL questions in the test
    const detailedResults = {};

    Object.keys(test.answers).forEach((qId) => {
      // Handle multi-answer questions (e.g., "25-26")
      if (qId.includes("-")) {
        const [q1, q2] = qId.split("-").map(Number);
        const correctAnswers = test.answers[qId]
          .split(",")
          .map((a) => a.trim());
        const userAnswer1 = parsedAnswers.answers?.[q1] || null;
        const userAnswer2 = parsedAnswers.answers?.[q2] || null;

        // Check if each individual answer is correct
        const isCorrect1 = userAnswer1 && correctAnswers.includes(userAnswer1);
        const isCorrect2 = userAnswer2 && correctAnswers.includes(userAnswer2);

        // Create separate entries for each question
        detailedResults[q1] = {
          userAnswer: userAnswer1,
          isCorrect: isCorrect1,
          correctAnswer: correctAnswers.join(", "),
        };

        detailedResults[q2] = {
          userAnswer: userAnswer2,
          isCorrect: isCorrect2,
          correctAnswer: correctAnswers.join(", "),
        };
      } else {
        // Regular single-answer question
        if (results[qId]) {
          // Question was in the stored results
          detailedResults[qId] = {
            ...results[qId],
            correctAnswer: test.answers[qId],
          };
        } else {
          // Question was not answered or not in stored results
          detailedResults[qId] = {
            userAnswer: null,
            isCorrect: false,
            correctAnswer: test.answers[qId],
          };
        }
      }
    });

    console.log(
      `Submission ${submissionId} - Total questions in test: ${
        Object.keys(test.answers).length
      }`
    );
    console.log(
      `Submission ${submissionId} - Questions in results: ${
        Object.keys(detailedResults).length
      }`
    );

    res.json({
      id: submission.id,
      userId: submission.user_id,
      username: submission.username,
      testId: submission.test_id,
      correctCount: submission.score,
      totalQuestions: submission.total_questions,
      bandScore: parsedAnswers.bandScore,
      timeSpent: submission.time_spent,
      submittedAt: submission.submitted_at,
      results: detailedResults,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all combined submissions (admin only)
router.get("/combined/all", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const submissions = CombinedSubmissionService.getAllCombinedSubmissions();
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get user's combined submission
router.get("/combined/my-submission", authMiddleware, (req, res) => {
  try {
    const submission = CombinedSubmissionService.getCombinedSubmissionByUserId(
      req.user.id
    );
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get combined submission by ID (admin only)
router.get("/combined/:id", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const submission = CombinedSubmissionService.getCombinedSubmissionById(
      parseInt(req.params.id)
    );

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Get detailed results for listening and reading
    const submissionData = { ...submission.submissionData };

    if (submissionData.listening) {
      const test = getTestData(submissionData.listening.testId);
      if (test && test.answers) {
        const detailedResults = {};
        Object.keys(test.answers).forEach((qId) => {
          const result = submissionData.listening.results?.[qId];
          if (result) {
            detailedResults[qId] = {
              ...result,
              correctAnswer: test.answers[qId],
            };
          } else {
            detailedResults[qId] = {
              userAnswer: null,
              isCorrect: false,
              correctAnswer: test.answers[qId],
            };
          }
        });
        submissionData.listening.detailedResults = detailedResults;
      }
    }

    if (submissionData.reading) {
      const test = getTestData(submissionData.reading.testId);
      if (test && test.answers) {
        const detailedResults = {};
        Object.keys(test.answers).forEach((qId) => {
          const result = submissionData.reading.results?.[qId];
          if (result) {
            detailedResults[qId] = {
              ...result,
              correctAnswer: test.answers[qId],
            };
          } else {
            detailedResults[qId] = {
              userAnswer: null,
              isCorrect: false,
              correctAnswer: test.answers[qId],
            };
          }
        });
        submissionData.reading.detailedResults = detailedResults;
      }
    }

    res.json({
      ...submission,
      submissionData,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Download PDF for combined submission (admin only)
router.get("/combined/:id/pdf", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const submission = CombinedSubmissionService.getCombinedSubmissionById(
      parseInt(req.params.id)
    );

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Get detailed results for listening and reading
    const submissionData = { ...submission.submissionData };

    if (submissionData.listening) {
      const test = getTestData(submissionData.listening.testId);
      if (test && test.answers) {
        const detailedResults = {};
        Object.keys(test.answers).forEach((qId) => {
          const result = submissionData.listening.results?.[qId];
          if (result) {
            detailedResults[qId] = {
              ...result,
              correctAnswer: test.answers[qId],
            };
          } else {
            detailedResults[qId] = {
              userAnswer: null,
              isCorrect: false,
              correctAnswer: test.answers[qId],
            };
          }
        });
        submissionData.listening.detailedResults = detailedResults;
      }
    }

    if (submissionData.reading) {
      const test = getTestData(submissionData.reading.testId);
      if (test && test.answers) {
        const detailedResults = {};
        Object.keys(test.answers).forEach((qId) => {
          const result = submissionData.reading.results?.[qId];
          if (result) {
            detailedResults[qId] = {
              ...result,
              correctAnswer: test.answers[qId],
            };
          } else {
            detailedResults[qId] = {
              userAnswer: null,
              isCorrect: false,
              correctAnswer: test.answers[qId],
            };
          }
        });
        submissionData.reading.detailedResults = detailedResults;
      }
    }

    const user = {
      name: submission.name,
      username: submission.username,
    };

    const pdfData = {
      ...submission,
      submissionData,
      overallBandScore: submission.overallBandScore,
      submittedAt: submission.updatedAt,
      listening: submissionData.listening,
      reading: submissionData.reading,
      writing: submissionData.writing,
    };

    // Generate PDF
    const doc = generateExamPDF(pdfData, user);

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=exam-report-${submission.username}-${submission.id}.pdf`
    );

    // Pipe the PDF to the response
    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
