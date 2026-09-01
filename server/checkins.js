const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { db } = require('./db');
const { requireAuth } = require('./auth');
const { generateExcelExport } = require('./export');
const { compositeAndSave } = require('./composite');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ─── Multer configuration ───────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB ceiling
});

// ─── Validate uploaded file is really an image (magic bytes) ────────────────

/**
 * Read the first few bytes to verify the file is actually an image,
 * not a renamed .exe or script.
 */
function validateImageMagicBytes(filePath) {
  const fd = fs.openSync(filePath, 'r');
  const buf = Buffer.alloc(12);
  fs.readSync(fd, buf, 0, 12, 0);
  fs.closeSync(fd);

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true;
  // WebP: RIFF....WEBP
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return true;

  return false;
}

// ─── Rate limiter (applied in index.js, but also importable) ────────────────

const rateLimit = require('express-rate-limit');

const checkinLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Too many submissions. Please wait a moment and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Routes ─────────────────────────────────────────────────────────────────

/**
 * POST /api/checkins
 * Public — rate-limited. Accepts multipart form with studentName + photo.
 */
router.post('/', checkinLimiter, upload.single('photo'), async (req, res) => {
  try {
    const { studentName } = req.body;

    // Validate student name
    if (!studentName || typeof studentName !== 'string' || studentName.trim().length === 0) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Student name is required' });
    }

    if (studentName.trim().length > 200) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Student name is too long' });
    }

    // Validate photo was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'Photo is required' });
    }

    // Validate magic bytes
    if (!validateImageMagicBytes(req.file.path)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Uploaded file is not a valid image' });
    }

    // Build a human-readable filename from the student name
    const safeName = studentName.trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/gi, '')   // remove special chars
      .replace(/\s+/g, '_');           // spaces → underscores
    const dateTag = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-'); // e.g. 2026-09-01-15-30-45
    const ext = path.extname(req.file.filename).toLowerCase() || '.jpg';
    const newFilename = `${safeName}_${dateTag}${ext}`;
    const newPath = path.join(uploadsDir, newFilename);

    // Composite the uploaded photo onto temp.jpeg and save to newPath
    await compositeAndSave(req.file.path, newPath);
    
    // Remove the original raw uploaded photo
    fs.unlinkSync(req.file.path);

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO checkins (id, student_name, photo_filename, created_at) VALUES (?, ?, ?, ?)'
    ).run(id, studentName.trim(), newFilename, now);

    res.status(201).json({
      id,
      studentName: studentName.trim(),
      photoUrl: `/uploads/${newFilename}`,
      createdAt: now,
    });
  } catch (err) {
    console.error('Error creating check-in:', err.message);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to save check-in' });
  }
});

/**
 * GET /api/checkins
 * Staff only. Returns all check-in records ordered by creation time.
 * Supports ?since=<ISO timestamp> for incremental polling.
 */
router.get('/', requireAuth, (req, res) => {
  try {
    const { since } = req.query;
    let records;

    if (since) {
      records = db.prepare(
        'SELECT * FROM checkins WHERE created_at > ? ORDER BY created_at ASC'
      ).all(since);
    } else {
      records = db.prepare(
        'SELECT * FROM checkins ORDER BY created_at ASC'
      ).all();
    }

    const result = records.map((r) => ({
      id: r.id,
      studentName: r.student_name,
      photoUrl: `/uploads/${r.photo_filename}`,
      createdAt: r.created_at,
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching check-ins:', err.message);
    res.status(500).json({ error: 'Failed to fetch check-ins' });
  }
});

/**
 * DELETE /api/checkins
 * Staff only. Deletes ALL records and their photos. Requires ?confirm=true.
 */
router.delete('/', requireAuth, (req, res) => {
  if (req.query.confirm !== 'true') {
    return res.status(400).json({ error: 'Confirmation required. Add ?confirm=true' });
  }

  try {
    // Get all photo filenames before deleting records
    const records = db.prepare('SELECT photo_filename FROM checkins').all();

    // Delete all records
    const result = db.prepare('DELETE FROM checkins').run();

    // Delete photo files
    for (const record of records) {
      const filePath = path.join(uploadsDir, record.photo_filename);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error(`Failed to delete photo ${record.photo_filename}:`, err.message);
      }
    }

    res.json({ message: `Cleared ${result.changes} check-in record(s)` });
  } catch (err) {
    console.error('Error clearing check-ins:', err.message);
    res.status(500).json({ error: 'Failed to clear check-ins' });
  }
});

/**
 * GET /api/checkins/export
 * Staff only. Downloads an Excel file with embedded photos.
 */
router.get('/export', requireAuth, async (req, res) => {
  try {
    const records = db.prepare('SELECT * FROM checkins ORDER BY created_at ASC').all();

    if (records.length === 0) {
      return res.status(404).json({ error: 'No check-in records to export' });
    }

    const workbook = await generateExcelExport(records);

    const dateStr = new Date().toISOString().slice(0, 10);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="family-checkins-${dateStr}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error exporting check-ins:', err.message);
    res.status(500).json({ error: 'Failed to export check-in data' });
  }
});

// ─── Multer error handler ───────────────────────────────────────────────────

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File is too large. Maximum size is 10 MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err.message && err.message.includes('images are allowed')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
