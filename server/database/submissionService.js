const db = require("./init");

class SubmissionService {
  // Create new submission
  static createSubmission(
    userId,
    testId,
    answers,
    score,
    totalQuestions,
    timeSpent
  ) {
    const result = db
      .prepare(
        `
      INSERT INTO submissions (user_id, test_id, answers, score, total_questions, time_spent)
      VALUES (?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        userId,
        testId,
        JSON.stringify(answers),
        score,
        totalQuestions,
        timeSpent
      );

    return this.getSubmissionById(result.lastInsertRowid);
  }

  // Get submission by ID
  static getSubmissionById(id) {
    const submission = db
      .prepare(
        `
      SELECT s.*, u.username
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `
      )
      .get(id);

    if (submission) {
      submission.answers = JSON.parse(submission.answers);
    }

    return submission;
  }

  // Get all submissions with user details
  static getAllSubmissions() {
    const submissions = db
      .prepare(
        `
      SELECT s.*, u.username
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.submitted_at DESC
    `
      )
      .all();

    return submissions.map((submission) => ({
      ...submission,
      answers: JSON.parse(submission.answers),
    }));
  }

  // Get submissions by user ID
  static getSubmissionsByUserId(userId) {
    const submissions = db
      .prepare(
        `
      SELECT *
      FROM submissions
      WHERE user_id = ?
      ORDER BY submitted_at DESC
    `
      )
      .all(userId);

    return submissions.map((submission) => ({
      ...submission,
      answers: JSON.parse(submission.answers),
    }));
  }

  // Get submissions by test ID
  static getSubmissionsByTestId(testId) {
    const submissions = db
      .prepare(
        `
      SELECT s.*, u.username
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      WHERE s.test_id = ?
      ORDER BY s.submitted_at DESC
    `
      )
      .all(testId);

    return submissions.map((submission) => ({
      ...submission,
      answers: JSON.parse(submission.answers),
    }));
  }

  // Delete submission
  static deleteSubmission(id) {
    const result = db.prepare("DELETE FROM submissions WHERE id = ?").run(id);
    return result.changes > 0;
  }

  // Delete all submissions for a user
  static deleteSubmissionsByUserId(userId) {
    const result = db
      .prepare("DELETE FROM submissions WHERE user_id = ?")
      .run(userId);
    return result.changes;
  }

  // Get submission statistics
  static getSubmissionStats() {
    const stats = db
      .prepare(
        `
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT test_id) as unique_tests,
        AVG(score) as average_score,
        AVG(time_spent) as average_time
      FROM submissions
    `
      )
      .get();

    return stats;
  }

  // Get user's best score for a test
  static getUserBestScore(userId, testId) {
    return db
      .prepare(
        `
      SELECT MAX(score) as best_score
      FROM submissions
      WHERE user_id = ? AND test_id = ?
    `
      )
      .get(userId, testId);
  }

  // Get recent submissions (limit)
  static getRecentSubmissions(limit = 10) {
    const submissions = db
      .prepare(
        `
      SELECT s.*, u.username
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.submitted_at DESC
      LIMIT ?
    `
      )
      .all(limit);

    return submissions.map((submission) => ({
      ...submission,
      answers: JSON.parse(submission.answers),
    }));
  }
}

module.exports = SubmissionService;
