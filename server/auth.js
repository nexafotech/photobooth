const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('./db');

const router = express.Router();

/**
 * Middleware: require authenticated session.
 * Attach to any route that should be staff-only.
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Create session
  req.session.userId = user.id;
  req.session.email = user.email;

  res.json({ user: { id: user.id, email: user.email } });
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});

/**
 * GET /api/auth/me
 * Returns current user if authenticated, 401 otherwise.
 */
router.get('/me', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user: { id: req.session.userId, email: req.session.email } });
});

module.exports = { router, requireAuth };
