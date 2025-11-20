const Database = require("better-sqlite3");
const path = require("path");
const bcrypt = require("bcryptjs");

const dbPath = path.join(__dirname, "ielts.db");
const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Create tables
function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
      assigned_tests TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Submissions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      test_id TEXT NOT NULL,
      answers TEXT NOT NULL,
      score INTEGER,
      total_questions INTEGER,
      time_spent INTEGER,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Active tests table
  db.exec(`
    CREATE TABLE IF NOT EXISTS active_tests (
      section TEXT PRIMARY KEY,
      test_id TEXT NOT NULL,
      test_path TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Combined submissions table (for complete exam: listening + reading + writing)
  db.exec(`
    CREATE TABLE IF NOT EXISTS combined_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      submission_data TEXT NOT NULL,
      overall_band_score REAL,
      completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Check if admin user exists
  const adminExists = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get("admin");

  if (!adminExists) {
    console.log("Creating default users...");

    // Create default admin user
    const adminPassword = bcrypt.hashSync("admin123", 10);
    db.prepare(
      `
      INSERT INTO users (username, password, role, assigned_tests)
      VALUES (?, ?, ?, ?)
    `
    ).run("admin", adminPassword, "admin", "{}");

    // Create default student users (no assigned tests needed - they see activated tests)
    const studentPassword = bcrypt.hashSync("password123", 10);

    db.prepare(
      `
      INSERT INTO users (username, password, role, assigned_tests)
      VALUES (?, ?, ?, ?)
    `
    ).run("student1", studentPassword, "user", "{}");

    db.prepare(
      `
      INSERT INTO users (username, password, role, assigned_tests)
      VALUES (?, ?, ?, ?)
    `
    ).run("student2", studentPassword, "user", "{}");

    console.log("Default users created successfully!");
  }

  console.log("Database initialized successfully!");
}

// Initialize on import
initializeDatabase();

module.exports = db;
