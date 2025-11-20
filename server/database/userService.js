const db = require("./init");

class UserService {
  // Get all users
  static getAllUsers() {
    const users = db
      .prepare(
        `
      SELECT id, username, role, assigned_tests, created_at
      FROM users
      ORDER BY created_at DESC
    `
      )
      .all();

    return users.map((user) => ({
      ...user,
      assigned_tests: JSON.parse(user.assigned_tests),
    }));
  }

  // Get user by ID
  static getUserById(id) {
    const user = db
      .prepare(
        `
      SELECT id, username, role, assigned_tests, created_at
      FROM users
      WHERE id = ?
    `
      )
      .get(id);

    if (user) {
      user.assigned_tests = JSON.parse(user.assigned_tests);
    }

    return user;
  }

  // Get user by username (for login)
  static getUserByUsername(username) {
    const user = db
      .prepare(
        `
      SELECT id, username, password, role, assigned_tests, created_at
      FROM users
      WHERE username = ?
    `
      )
      .get(username);

    if (user) {
      user.assigned_tests = JSON.parse(user.assigned_tests);
    }

    return user;
  }

  // Create new user
  static createUser(username, hashedPassword, role, assignedTests = []) {
    try {
      const result = db
        .prepare(
          `
        INSERT INTO users (username, password, role, assigned_tests)
        VALUES (?, ?, ?, ?)
      `
        )
        .run(username, hashedPassword, role, JSON.stringify(assignedTests));

      return this.getUserById(result.lastInsertRowid);
    } catch (error) {
      if (error.code === "SQLITE_CONSTRAINT") {
        throw new Error("Username already exists");
      }
      throw error;
    }
  }

  // Update user
  static updateUser(id, updates) {
    const user = this.getUserById(id);
    if (!user) {
      throw new Error("User not found");
    }

    const { username, password, role, assigned_tests } = updates;

    if (password) {
      // Update with password
      db.prepare(
        `
        UPDATE users
        SET username = ?, password = ?, role = ?, assigned_tests = ?
        WHERE id = ?
      `
      ).run(
        username || user.username,
        password,
        role || user.role,
        JSON.stringify(assigned_tests || user.assigned_tests),
        id
      );
    } else {
      // Update without password
      db.prepare(
        `
        UPDATE users
        SET username = ?, role = ?, assigned_tests = ?
        WHERE id = ?
      `
      ).run(
        username || user.username,
        role || user.role,
        JSON.stringify(assigned_tests || user.assigned_tests),
        id
      );
    }

    return this.getUserById(id);
  }

  // Delete user
  static deleteUser(id) {
    const result = db.prepare("DELETE FROM users WHERE id = ?").run(id);
    return result.changes > 0;
  }

  // Get user count by role
  static getUserStats() {
    const stats = db
      .prepare(
        `
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `
      )
      .all();

    return {
      total: stats.reduce((sum, s) => sum + s.count, 0),
      admins: stats.find((s) => s.role === "admin")?.count || 0,
      users: stats.find((s) => s.role === "user")?.count || 0,
    };
  }
}

module.exports = UserService;
