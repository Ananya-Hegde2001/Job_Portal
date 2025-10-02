import express from 'express';
import { db } from '../db/index.js';
import { authRequired, requireRole, maybeAuth } from './middleware.js';

const router = express.Router();

// Helper: dispatch job alert notifications for a newly approved job
function dispatchJobAlerts(job) {
  try {
    // Only for approved jobs
    if (job.status !== 'approved') return;
    const alerts = db.prepare('SELECT * FROM job_alert_subscriptions').all();
    if (!alerts.length) return;
    const subj = (job.subject || '').toLowerCase();
    const locs = [(job.city||'').toLowerCase(), (job.location||'').toLowerCase()].filter(Boolean);
    const notifiedUserIds = new Set();
    for (const a of alerts) {
      // Match logic: if alert.subject set, require exact case-insensitive equality with job.subject.
      if (a.subject) {
        if (!subj || a.subject.toLowerCase() !== subj) continue;
      }
      // If alert.location set, require equality with either job.city or job.location.
      if (a.location) {
        const al = a.location.toLowerCase();
        if (!locs.length || !locs.includes(al)) continue;
      }
      if (notifiedUserIds.has(a.user_id)) continue; // avoid duplicate if multiple alerts match
      notifiedUserIds.add(a.user_id);
      const msg = `New job posted: ${job.title}${job.subject? ' · '+job.subject: ''}${job.city? ' · '+job.city: (job.location? ' · '+job.location:'')}`;
      db.prepare('INSERT INTO notifications (user_id, type, message) VALUES (?,?,?)').run(a.user_id, 'job_alert', msg);
    }
    if (notifiedUserIds.size) {
      console.log(`[alerts] Dispatched job alert notifications for job ${job.id} to ${notifiedUserIds.size} user(s)`);
    }
  } catch (err) {
    console.error('Failed to dispatch job alerts:', err.message);
  }
}

router.get('/', maybeAuth, (req, res) => {
  const { q, subject, grade, location, status, organization_type, employment_type, min_experience, city, remote, active, mine, mode } = req.query;
  let sql = `SELECT j.*, u.name as employer_name FROM jobs j JOIN users u ON u.id = j.employer_id WHERE 1=1`;
  const params = [];
  const isMine = mine === '1' && req.user && req.user.role === 'employer';
  if (q) { sql += ' AND (j.title LIKE ? OR j.description LIKE ? OR j.institution_name LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (subject) { sql += ' AND j.subject = ?'; params.push(subject); }
  if (grade) { sql += ' AND j.grade_level = ?'; params.push(grade); }
  if (location) { sql += ' AND j.location = ?'; params.push(location); }
  if (city) { sql += ' AND j.city = ?'; params.push(city); }
  if (organization_type) { sql += ' AND j.organization_type = ?'; params.push(organization_type); }
  if (employment_type) { sql += ' AND j.employment_type = ?'; params.push(employment_type); }
  if (min_experience) { sql += ' AND (j.min_experience IS NULL OR j.min_experience <= ?)'; params.push(Number(min_experience)); }
  // High-level mode mapping (remote/onsite/school/college/tuition)
  if (mode) {
    if (mode === 'remote') {
      sql += ' AND j.remote_allowed = 1';
    } else if (mode === 'onsite') {
      sql += ' AND j.remote_allowed = 0';
    } else if (mode === 'school') {
      sql += ' AND (j.institution_name LIKE ? OR j.organization_type = ?)';
      params.push('%School%', 'international_school');
    } else if (mode === 'college') {
      sql += ' AND (j.organization_type IN (?, ?) OR j.institution_name LIKE ? OR j.institution_name LIKE ?)';
      params.push('public_university', 'deemed', '%University%', '%College%');
    } else if (mode === 'tuition') {
      sql += ' AND (j.institution_name LIKE ? OR (j.organization_type = ? AND (j.grade_level LIKE ? OR j.grade_level LIKE ?)))';
      params.push('%Coaching%', 'private', '%JEE%', '%Professional%');
    }
  } else if (typeof remote !== 'undefined') {
    // Backward compatibility: numeric remote filter ('1' or '0')
    sql += ' AND j.remote_allowed = ?';
    params.push(remote === '1' ? 1 : 0);
  }
  if (active === '1') { sql += ' AND (j.application_deadline IS NULL OR j.application_deadline >= date("now"))'; }
  if (isMine) {
    sql += ' AND j.employer_id = ?';
    params.push(req.user.id);
    // show all statuses for owner's view unless explicit status filter provided
    if (status) { sql += ' AND j.status = ?'; params.push(status); }
  } else {
    if (status) { sql += ' AND j.status = ?'; params.push(status); } else { sql += " AND j.status = 'approved'"; }
  }
  sql += ' ORDER BY j.created_at DESC LIMIT 100';
  let rows = db.prepare(sql).all(...params);
  if (req.user && req.user.role === 'teacher') {
    const saved = db.prepare('SELECT job_id FROM saved_jobs WHERE user_id = ?').all(req.user.id).map(r=>r.job_id);
    const set = new Set(saved);
    rows = rows.map(j => ({ ...j, is_saved: set.has(j.id) }));
  }
  res.json({ jobs: rows, mine: isMine });
});

router.post('/', authRequired, requireRole('employer'), (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'Missing fields'});
  // Map draft -> pending (internal) publish -> approved? keep moderation simple: approved only when explicitly published
  let incomingStatus = req.body.status;
  if (incomingStatus === 'draft') incomingStatus = 'pending';
  else if (incomingStatus === 'publish') incomingStatus = 'approved';
  const status = ['pending','approved'].includes(incomingStatus) ? incomingStatus : 'pending';
  try {
  const fields = ['subject','grade_level','location','salary_min','salary_max','organization_type','institution_name','employment_type','min_experience','education_required','skills_required','application_deadline','responsibilities','requirements','pay_scale','benefits','organization_website','city','remote_allowed','department'];
  const placeholders = fields.map(()=>'?').join(',');
  const values = fields.map(f => (req.body[f] === undefined ? null : req.body[f]));
  const info = db.prepare(`INSERT INTO jobs (employer_id,title,description,status,${fields.join(',')}) VALUES (? ,?,? ,? ,${placeholders})`)
    .run(req.user.id, title, description, status, ...values);
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(info.lastInsertRowid);
    console.log(`[jobs] Created job ${job.id} for employer ${req.user.id} with status=${status}`);
  // Dispatch alerts immediately if already approved
  dispatchJobAlerts(job);
  res.status(201).json({ job });
  } catch (e) {
    console.error('Failed to create job:', e.message);
    return res.status(500).json({ error: 'Failed to create job' });
  }
});

router.get('/:id', maybeAuth, (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Not found'});
  if (job.status !== 'approved') return res.status(403).json({ error: 'Not accessible'});
  let enriched = job;
  if (req.user && req.user.role === 'teacher') {
    const existing = db.prepare('SELECT 1 FROM saved_jobs WHERE user_id = ? AND job_id = ?').get(req.user.id, job.id);
    enriched = { ...job, is_saved: !!existing };
  }
  res.json({ job: enriched });
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
  const prevStatus = job.status;
  db.prepare(`UPDATE jobs SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(job.id);
  if (prevStatus !== 'approved' && updated.status === 'approved') {
    dispatchJobAlerts(updated);
  }
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
