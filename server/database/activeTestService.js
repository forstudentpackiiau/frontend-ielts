const db = require("./init");

class ActiveTestService {
  // Get active test for a section
  static getActiveTest(section) {
    return db
      .prepare(
        `
      SELECT section, test_id, test_path, updated_at
      FROM active_tests
      WHERE section = ?
    `
      )
      .get(section);
  }

  // Get all active tests
  static getAllActiveTests() {
    const tests = db
      .prepare(
        `
      SELECT section, test_id, test_path, updated_at
      FROM active_tests
    `
      )
      .all();

    const result = {};
    tests.forEach((test) => {
      result[test.section] = {
        testId: test.test_id,
        testPath: test.test_path,
        updatedAt: test.updated_at,
      };
    });

    return result;
  }

  // Set active test for a section (replaces existing)
  static setActiveTest(section, testId, testPath) {
    db.prepare(
      `
      INSERT INTO active_tests (section, test_id, test_path, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(section) DO UPDATE SET
        test_id = excluded.test_id,
        test_path = excluded.test_path,
        updated_at = CURRENT_TIMESTAMP
    `
    ).run(section, testId, testPath);

    return this.getActiveTest(section);
  }

  // Deactivate test for a section
  static deactivateTest(section) {
    const result = db
      .prepare(
        `
      DELETE FROM active_tests WHERE section = ?
    `
      )
      .run(section);

    return result.changes > 0;
  }

  // Clear all active tests
  static clearAllActiveTests() {
    db.prepare("DELETE FROM active_tests").run();
  }

  // Check if a test is active
  static isTestActive(testId) {
    const result = db
      .prepare(
        `
      SELECT COUNT(*) as count
      FROM active_tests
      WHERE test_id = ?
    `
      )
      .get(testId);

    return result.count > 0;
  }

  // Get active test count
  static getActiveTestCount() {
    const result = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM active_tests
    `
      )
      .get();

    return result.count;
  }
}

module.exports = ActiveTestService;
