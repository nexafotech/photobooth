#!/usr/bin/env node

/**
 * Seed a staff user account.
 *
 * Usage:
 *   node server/seed-admin.js <email> <password>
 *
 * Example:
 *   node server/seed-admin.js admin@school.org MySecurePass123
 */

const bcrypt = require('bcryptjs');
const { db } = require('./db');

const [,, email, password] = process.argv;

if (!email || !password) {
  console.error('Usage: node server/seed-admin.js <email> <password>');
  console.error('Example: node server/seed-admin.js admin@school.org MySecurePass123');
  process.exit(1);
}

if (password.length < 8) {
  console.error('Password must be at least 8 characters long.');
  process.exit(1);
}

const normalizedEmail = email.toLowerCase().trim();

// Check if user already exists
const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
if (existing) {
  console.log(`User "${normalizedEmail}" already exists. Updating password...`);
  const hash = bcrypt.hashSync(password, 12);
  db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(hash, normalizedEmail);
  console.log('Password updated successfully.');
} else {
  const hash = bcrypt.hashSync(password, 12);
  db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(normalizedEmail, hash);
  console.log(`Staff user "${normalizedEmail}" created successfully.`);
}

process.exit(0);
