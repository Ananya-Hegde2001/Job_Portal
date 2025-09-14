import express from 'express';
import { db } from '../db/index.js';
import { authRequired, requireRole } from './middleware.js';

const router = express.Router();

// All routes here require admin
router.use(authRequired, requireRole('admin'));

router.get('/summary', (req, res) => {
  const userCounts = db.prepare("SELECT role, COUNT(*) as count FROM users GROUP BY role").all();
  const jobStatus = db.prepare("SELECT status, COUNT(*) as count FROM jobs GROUP BY status").all();
  const appStatus = db.prepare("SELECT status, COUNT(*) as count FROM applications GROUP BY status").all();
  const recentJobs = db.prepare("SELECT id, title, status, created_at FROM jobs ORDER BY created_at DESC LIMIT 8").all();
  const recentApplications = db.prepare(`SELECT a.id, a.status, a.created_at, j.title as job_title, u.name as teacher_name
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN users u ON u.id = a.teacher_id
    ORDER BY a.created_at DESC LIMIT 10`).all();
  res.json({ users: userCounts, jobs: jobStatus, applications: appStatus, recentJobs, recentApplications });
});

router.get('/jobs', (req, res) => {
  const { status, q, limit } = req.query;
  let sql = `SELECT j.*, u.name as employer_name FROM jobs j JOIN users u ON u.id = j.employer_id WHERE 1=1`;
  const params = [];
  if (q) { sql += ' AND (j.title LIKE ? OR j.description LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  if (status) { sql += ' AND j.status = ?'; params.push(status); }
  sql += ' ORDER BY j.created_at DESC LIMIT ' + (Math.min(200, Number(limit)||100));
  const rows = db.prepare(sql).all(...params);
  res.json({ jobs: rows });
});

router.put('/jobs/:id/status', (req, res) => {
  const { status } = req.body;
  const allowed = ['pending','approved','rejected','closed'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status'});
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Not found'});
  db.prepare('UPDATE jobs SET status = ? WHERE id = ?').run(status, job.id);
  const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(job.id);
  res.json({ job: updated });
});

router.get('/applications', (req, res) => {
  const { status, job_id, limit } = req.query;
  let sql = `SELECT a.*, j.title as job_title, u.name as teacher_name FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN users u ON u.id = a.teacher_id WHERE 1=1`;
  const params = [];
  if (status) { sql += ' AND a.status = ?'; params.push(status); }
  if (job_id) { sql += ' AND a.job_id = ?'; params.push(job_id); }
  sql += ' ORDER BY a.created_at DESC LIMIT ' + (Math.min(300, Number(limit)||100));
  const rows = db.prepare(sql).all(...params);
  res.json({ applications: rows });
});

router.get('/users', (req, res) => {
  const { role, q, limit } = req.query;
  let sql = 'SELECT id, email, role, name, created_at FROM users WHERE 1=1';
  const params = [];
  if (role) { sql += ' AND role = ?'; params.push(role); }
  if (!role) { // hide admin accounts by default
    sql += " AND role != 'admin'";
  }
  if (q) { sql += ' AND (email LIKE ? OR name LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY created_at DESC LIMIT ' + (Math.min(300, Number(limit)||100));
  const rows = db.prepare(sql).all(...params);
  res.json({ users: rows });
});

router.put('/applications/:id/status', (req, res) => {
  const { status } = req.body;
  const allowed = ['submitted','shortlisted','rejected','hired'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status'});
  const appRow = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!appRow) return res.status(404).json({ error: 'Not found'});
  db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, appRow.id);
  const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(appRow.id);
  res.json({ application: updated });
});

export default router;
