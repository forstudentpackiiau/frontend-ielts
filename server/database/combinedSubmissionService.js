const db = require("./init");

class CombinedSubmissionService {
  /**
   * Create or update a combined submission (all three sections)
   */
  static createOrUpdateCombinedSubmission(userId, sectionData, section) {
    try {
      // Check if a combined submission already exists for this user
      const existing = db
        .prepare(
          `SELECT * FROM combined_submissions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`
        )
        .get(userId);

      if (existing) {
        // Update existing submission
        const data = JSON.parse(existing.submission_data);
        data[section] = sectionData;

        // Calculate overall band score
        const overallBandScore = this.calculateOverallBandScore(data);

        db.prepare(
          `UPDATE combined_submissions 
           SET submission_data = ?, 
               overall_band_score = ?,
               updated_at = CURRENT_TIMESTAMP,
               completed = ?
           WHERE id = ?`
        ).run(
          JSON.stringify(data),
          overallBandScore,
          data.listening && data.reading && data.writing ? 1 : 0,
          existing.id
        );

        return existing.id;
      } else {
        // Create new combined submission
        const data = { [section]: sectionData };
        const overallBandScore = this.calculateOverallBandScore(data);

        const result = db
          .prepare(
            `INSERT INTO combined_submissions (user_id, submission_data, overall_band_score, completed)
             VALUES (?, ?, ?, ?)`
          )
          .run(
            userId,
            JSON.stringify(data),
            overallBandScore,
            data.listening && data.reading && data.writing ? 1 : 0
          );

        return result.lastInsertRowid;
      }
    } catch (error) {
      console.error("Error creating/updating combined submission:", error);
      throw error;
    }
  }

  /**
   * Calculate overall band score from all sections
   */
  static calculateOverallBandScore(data) {
    const scores = [];

    if (data.listening?.bandScore) scores.push(data.listening.bandScore);
    if (data.reading?.bandScore) scores.push(data.reading.bandScore);
    if (data.writing?.bandScore) scores.push(data.writing.bandScore);

    if (scores.length === 0) return null;

    const average =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;
    // Round to nearest 0.5
    return Math.round(average * 2) / 2;
  }

  /**
   * Get combined submission by ID
   */
  static getCombinedSubmissionById(id) {
    try {
      const submission = db
        .prepare(
          `SELECT cs.*, u.username, u.username AS name
           FROM combined_submissions cs
           LEFT JOIN users u ON cs.user_id = u.id
           WHERE cs.id = ?`
        )
        .get(id);

      if (!submission) return null;

      return {
        id: submission.id,
        userId: submission.user_id,
        username: submission.username,
        name: submission.name,
        submissionData: JSON.parse(submission.submission_data),
        overallBandScore: submission.overall_band_score,
        completed: submission.completed === 1,
        createdAt: submission.created_at,
        updatedAt: submission.updated_at,
      };
    } catch (error) {
      console.error("Error fetching combined submission:", error);
      throw error;
    }
  }

  /**
   * Get combined submission by user ID
   */
  static getCombinedSubmissionByUserId(userId) {
    try {
      const submission = db
        .prepare(
          `SELECT cs.*, u.username, u.username AS name
           FROM combined_submissions cs
           LEFT JOIN users u ON cs.user_id = u.id
           WHERE cs.user_id = ?
           ORDER BY cs.created_at DESC
           LIMIT 1`
        )
        .get(userId);

      if (!submission) return null;

      return {
        id: submission.id,
        userId: submission.user_id,
        username: submission.username,
        name: submission.name,
        submissionData: JSON.parse(submission.submission_data),
        overallBandScore: submission.overall_band_score,
        completed: submission.completed === 1,
        createdAt: submission.created_at,
        updatedAt: submission.updated_at,
      };
    } catch (error) {
      console.error("Error fetching combined submission by user:", error);
      throw error;
    }
  }

  /**
   * Get all combined submissions (admin)
   */
  static getAllCombinedSubmissions() {
    try {
      const submissions = db
        .prepare(
          `SELECT cs.*, u.username, u.username AS name
           FROM combined_submissions cs
           LEFT JOIN users u ON cs.user_id = u.id
           ORDER BY cs.updated_at DESC`
        )
        .all();

      return submissions.map((submission) => ({
        id: submission.id,
        userId: submission.user_id,
        username: submission.username,
        name: submission.name,
        submissionData: JSON.parse(submission.submission_data),
        overallBandScore: submission.overall_band_score,
        completed: submission.completed === 1,
        createdAt: submission.created_at,
        updatedAt: submission.updated_at,
      }));
    } catch (error) {
      console.error("Error fetching all combined submissions:", error);
      throw error;
    }
  }

  /**
   * Delete combined submission
   */
  static deleteCombinedSubmission(id) {
    try {
      db.prepare(`DELETE FROM combined_submissions WHERE id = ?`).run(id);
    } catch (error) {
      console.error("Error deleting combined submission:", error);
      throw error;
    }
  }
}

module.exports = CombinedSubmissionService;
