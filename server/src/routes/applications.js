import express from 'express';
import { db } from '../db/index.js';
import { authRequired, requireRole } from './middleware.js';

const router = express.Router();

router.post('/', authRequired, requireRole('teacher'), (req, res, next) => {
  try {
    let { job_id, cover_letter } = req.body;
    if (job_id === undefined || job_id === null || job_id === '') {
      return res.status(400).json({ error: 'Missing job_id' });
    }
    job_id = Number(job_id);
    if (!Number.isInteger(job_id) || job_id <= 0) {
      return res.status(400).json({ error: 'Invalid job_id' });
    }
    const job = db.prepare('SELECT id, status FROM jobs WHERE id = ?').get(job_id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'approved') return res.status(400).json({ error: 'Job not open for applications' });

    // Quick pre-check to give cleaner error than UNIQUE constraint
    const existing = db.prepare('SELECT id FROM applications WHERE job_id = ? AND teacher_id = ?').get(job_id, req.user.id);
    if (existing) return res.status(409).json({ error: 'Already applied' });

    const info = db.prepare('INSERT INTO applications (job_id, teacher_id, cover_letter) VALUES (?,?,?)')
      .run(job_id, req.user.id, cover_letter || null);
    return res.status(201).json({ application: { id: info.lastInsertRowid, job_id, teacher_id: req.user.id, cover_letter: cover_letter || null, status: 'submitted' } });
  } catch (e) {
    // Log full error server-side
    console.error('POST /applications failed:', e.message);
    if (e.message && e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Already applied' });
    }
    return next(e); // delegate to global error handler
  }
});

router.get('/mine', authRequired, requireRole('teacher'), (req, res) => {
  const rows = db.prepare(`SELECT a.*, j.title FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.teacher_id = ? ORDER BY a.created_at DESC`).all(req.user.id);
  res.json({ applications: rows });
});

router.get('/job/:jobId', authRequired, requireRole('employer','admin'), (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found'});
  if (req.user.role === 'employer' && job.employer_id !== req.user.id) return res.status(403).json({ error: 'Forbidden'});
  const rows = db.prepare(`SELECT a.*, u.name as teacher_name FROM applications a JOIN users u ON u.id = a.teacher_id WHERE a.job_id = ? ORDER BY a.created_at DESC`).all(job.id);
  res.json({ applications: rows });
});

// Recent applications across all jobs owned by employer
router.get('/employer/recent', authRequired, requireRole('employer','admin'), (req, res) => {
  let employerId = req.user.id;
  if (req.user.role === 'admin' && req.query.employer_id) employerId = Number(req.query.employer_id) || employerId;
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const rows = db.prepare(`
    SELECT a.*, u.name as teacher_name, j.title as job_title
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN users u ON u.id = a.teacher_id
    WHERE j.employer_id = ?
    ORDER BY a.created_at DESC
    LIMIT ?
  `).all(employerId, limit);
  res.json({ applications: rows });
});

router.put('/:id/status', authRequired, requireRole('employer','admin'), (req, res) => {
  const { status } = req.body;
  if (!['submitted','shortlisted','rejected','hired'].includes(status)) return res.status(400).json({ error: 'Bad status'});
  const appRow = db.prepare('SELECT a.*, j.employer_id FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.id = ?').get(req.params.id);
  if (!appRow) return res.status(404).json({ error: 'Not found'});
  if (req.user.role === 'employer' && appRow.employer_id !== req.user.id) return res.status(403).json({ error: 'Forbidden'});
  db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, appRow.id);
  const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(appRow.id);
  res.json({ application: updated });
});

export default router;
