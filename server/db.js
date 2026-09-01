const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// Ensure data directory exists
const dataDir = path.resolve(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'checkins.db'));

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS checkins (
    id TEXT PRIMARY KEY,
    student_name TEXT NOT NULL,
    photo_filename TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_checkins_created_at ON checkins(created_at);

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

/**
 * Enforce data retention policy — delete records older than RETENTION_DAYS.
 * Also removes the associated photo files from disk.
 */
function enforceRetention(retentionDays) {
  if (!retentionDays || retentionDays <= 0) return;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  const cutoffStr = cutoff.toISOString();

  // Find old records to delete their photos
  const oldRecords = db.prepare(
    'SELECT photo_filename FROM checkins WHERE created_at < ?'
  ).all(cutoffStr);

  const uploadsDir = path.resolve(__dirname, '..', 'uploads');
  for (const record of oldRecords) {
    const filePath = path.join(uploadsDir, record.photo_filename);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error(`Failed to delete photo ${record.photo_filename}:`, err.message);
    }
  }

  const result = db.prepare('DELETE FROM checkins WHERE created_at < ?').run(cutoffStr);
  if (result.changes > 0) {
    console.log(`[Retention] Deleted ${result.changes} record(s) older than ${retentionDays} days`);
  }
}

module.exports = { db, enforceRetention };
