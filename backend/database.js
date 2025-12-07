
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite file
// In production (Railway/Render), this file should be on a mounted volume
const dbPath = path.resolve(__dirname, 'arena.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database ' + dbPath + ': ' + err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    // CRITICAL PERFORMANCE FIX: Enable Write-Ahead Logging
    // This allows multiple students to read the leaderboard while others are submitting code.
    db.run("PRAGMA journal_mode = WAL;");
    db.run("PRAGMA synchronous = NORMAL;");

    // Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      name TEXT,
      password TEXT,
      role TEXT DEFAULT 'student',
      score INTEGER DEFAULT 0
    )`);

    // Challenges Table
    db.run(`CREATE TABLE IF NOT EXISTS challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      difficulty TEXT,
      points INTEGER,
      starter_code TEXT
    )`);

    // Test Cases
    db.run(`CREATE TABLE IF NOT EXISTS test_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      challenge_id INTEGER,
      input TEXT,
      expected_output TEXT,
      is_hidden INTEGER DEFAULT 0,
      FOREIGN KEY(challenge_id) REFERENCES challenges(id)
    )`);

    // Submissions
    db.run(`CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      challenge_id INTEGER,
      code TEXT,
      language TEXT,
      status TEXT,
      runtime INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Seed Admin if not exists
    const adminEmail = "manafmajid992@gmail.com";
    db.get("SELECT * FROM users WHERE email = ?", [adminEmail], (err, row) => {
      if (!row) {
        db.run("INSERT INTO users (email, password, name, role, score) VALUES (?, ?, ?, ?, ?)", 
          [adminEmail, "960604499@6230442", "Admin Manaf", "admin", 0]);
        console.log("Admin account seeded.");
      }
    });
  });
}

module.exports = db;
