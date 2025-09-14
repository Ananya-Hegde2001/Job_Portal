import express from 'express';
import { db } from '../db/index.js';
import { authRequired, requireRole } from './middleware.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { q, subject, grade, location, status, organization_type, employment_type, min_experience, city, remote, active } = req.query;
  let sql = `SELECT j.*, u.name as employer_name FROM jobs j JOIN users u ON u.id = j.employer_id WHERE 1=1`;
  const params = [];
  if (q) { sql += ' AND (j.title LIKE ? OR j.description LIKE ? OR j.institution_name LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (subject) { sql += ' AND j.subject = ?'; params.push(subject); }
  if (grade) { sql += ' AND j.grade_level = ?'; params.push(grade); }
  if (location) { sql += ' AND j.location = ?'; params.push(location); }
  if (city) { sql += ' AND j.city = ?'; params.push(city); }
  if (organization_type) { sql += ' AND j.organization_type = ?'; params.push(organization_type); }
  if (employment_type) { sql += ' AND j.employment_type = ?'; params.push(employment_type); }
  if (min_experience) { sql += ' AND (j.min_experience IS NULL OR j.min_experience <= ?)'; params.push(Number(min_experience)); }
  if (typeof remote !== 'undefined') { sql += ' AND j.remote_allowed = ?'; params.push(remote === '1' ? 1 : 0); }
  if (active === '1') { sql += ' AND (j.application_deadline IS NULL OR j.application_deadline >= date("now"))'; }
  if (status) { sql += ' AND j.status = ?'; params.push(status); } else { sql += " AND j.status = 'approved'"; }
  sql += ' ORDER BY j.created_at DESC LIMIT 100';
  const rows = db.prepare(sql).all(...params);
  res.json({ jobs: rows });
});

router.post('/', authRequired, requireRole('employer'), (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'Missing fields'});
  // Map draft -> pending (internal) publish -> approved? keep moderation simple: approved only when explicitly published
  let incomingStatus = req.body.status;
  if (incomingStatus === 'draft') incomingStatus = 'pending';
  else if (incomingStatus === 'publish') incomingStatus = 'approved';
  const status = ['pending','approved'].includes(incomingStatus) ? incomingStatus : 'pending';
  const fields = ['subject','grade_level','location','salary_min','salary_max','organization_type','institution_name','employment_type','min_experience','education_required','skills_required','application_deadline','responsibilities','requirements','pay_scale','benefits','organization_website','city','remote_allowed','department'];
  const placeholders = fields.map(()=>'?').join(',');
  const values = fields.map(f => (req.body[f] === undefined ? null : req.body[f]));
  const info = db.prepare(`INSERT INTO jobs (employer_id,title,description,status,${fields.join(',')}) VALUES (? ,?,? ,? ,${placeholders})`)
    .run(req.user.id, title, description, status, ...values);
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ job });
});

router.get('/:id', (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Not found'});
  if (job.status !== 'approved') return res.status(403).json({ error: 'Not accessible'});
  res.json({ job });
});

router.put('/:id', authRequired, requireRole('employer','admin'), (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Not found'});
  if (req.user.role === 'employer' && job.employer_id !== req.user.id) return res.status(403).json({ error: 'Forbidden'});
  if ('status' in req.body) {
    if (req.body.status === 'publish') req.body.status = 'approved';
    else if (req.body.status === 'draft') req.body.status = 'pending';
    const allowed = ['pending','approved','rejected','closed'];
    if (!allowed.includes(req.body.status)) delete req.body.status; // ignore invalid
  }
  const fields = ['title','description','subject','grade_level','location','salary_min','salary_max','status','organization_type','institution_name','employment_type','min_experience','education_required','skills_required','application_deadline','responsibilities','requirements','pay_scale','benefits','organization_website','city','remote_allowed','department'];
  const updates = [];
  const params = [];
  for (const f of fields) if (f in req.body) { updates.push(`${f} = ?`); params.push(req.body[f]); }
  if (!updates.length) return res.json({ job });
  params.push(job.id);
  db.prepare(`UPDATE jobs SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(job.id);
  res.json({ job: updated });
});

router.delete('/:id', authRequired, requireRole('employer','admin'), (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Not found'});
  if (req.user.role === 'employer' && job.employer_id !== req.user.id) return res.status(403).json({ error: 'Forbidden'});
  db.prepare('DELETE FROM jobs WHERE id = ?').run(job.id);
  res.json({ success: true });
});

export default router;
