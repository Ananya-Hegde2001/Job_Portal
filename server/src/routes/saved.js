import express from 'express';
import { db } from '../db/index.js';
import { authRequired, requireRole } from './middleware.js';

const router = express.Router();

// Get saved jobs list for current teacher
router.get('/jobs', authRequired, requireRole('teacher'), (req, res) => {
  const rows = db.prepare(`
    SELECT j.id, j.title, j.institution_name, j.city, j.description, j.subject, j.grade_level, j.employment_type, j.salary_min, j.salary_max, j.pay_scale, j.status, s.created_at as saved_at
    FROM saved_jobs s
    JOIN jobs j ON j.id = s.job_id
    WHERE s.user_id = ?
    ORDER BY s.created_at DESC
    LIMIT 200
  `).all(req.user.id);
  res.json({ jobs: rows });
});

// Toggle save
router.post('/jobs/:jobId', authRequired, requireRole('teacher'), (req, res) => {
  const jobId = Number(req.params.jobId);
  if (!jobId) return res.status(400).json({ error: 'Bad job id' });
  const job = db.prepare('SELECT id, status FROM jobs WHERE id = ?').get(jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  // only allow saving approved jobs
  if (job.status !== 'approved') return res.status(400).json({ error: 'Job not available' });
  const existing = db.prepare('SELECT 1 FROM saved_jobs WHERE user_id = ? AND job_id = ?').get(req.user.id, jobId);
  if (existing) {
    db.prepare('DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?').run(req.user.id, jobId);
    return res.json({ saved: false });
  } else {
    db.prepare('INSERT INTO saved_jobs (user_id, job_id) VALUES (?,?)').run(req.user.id, jobId);
    return res.json({ saved: true });
  }
});

// List alert subscriptions
router.get('/alerts', authRequired, requireRole('teacher'), (req, res) => {
  const subs = db.prepare('SELECT * FROM job_alert_subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
  res.json({ alerts: subs });
});

// Create alert subscription
router.post('/alerts', authRequired, requireRole('teacher'), (req, res) => {
  let { subject, location } = req.body;
  subject = (subject || '').trim() || null;
  location = (location || '').trim() || null;
  if (!subject && !location) return res.status(400).json({ error: 'Provide subject or location' });
  const count = db.prepare('SELECT COUNT(*) as c FROM job_alert_subscriptions WHERE user_id = ?').get(req.user.id).c;
  if (count >= 10) return res.status(400).json({ error: 'Alert limit reached' });
  const info = db.prepare('INSERT INTO job_alert_subscriptions (user_id, subject, location) VALUES (?,?,?)').run(req.user.id, subject, location);
  const row = db.prepare('SELECT * FROM job_alert_subscriptions WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ alert: row });
});

router.delete('/alerts/:id', authRequired, requireRole('teacher'), (req, res) => {
  const sub = db.prepare('SELECT * FROM job_alert_subscriptions WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!sub) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM job_alert_subscriptions WHERE id = ?').run(sub.id);
  res.json({ success: true });
});

export default router;
