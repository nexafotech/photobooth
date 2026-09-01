const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const { db, enforceRetention } = require('./db');
const { router: authRouter } = require('./auth');
const checkinRouter = require('./checkins');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ──────────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS for development (Vite on port 5173)
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }));
}

// Sessions (stored in memory for simplicity; use a store for production scale)
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// ─── Serve uploaded photos ──────────────────────────────────────────────────
// Photos use UUID filenames (unguessable) so the check-in confirmation
// can show the just-submitted photo without requiring auth.
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ─── API Routes ─────────────────────────────────────────────────────────────

app.use('/api/auth', authRouter);
app.use('/api/checkins', checkinRouter);

// ─── Production: serve React build ─────────────────────────────────────────

const clientDist = path.resolve(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ─── Data retention on startup ──────────────────────────────────────────────

const retentionDays = parseInt(process.env.RETENTION_DAYS || '30', 10);
enforceRetention(retentionDays);

// ─── Start server ───────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[Family Check-In] Server running on http://localhost:${PORT}`);
  console.log(`[Family Check-In] Data retention: ${retentionDays} days`);
});
