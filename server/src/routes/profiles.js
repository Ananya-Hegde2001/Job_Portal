import express from 'express';
import multer from 'multer';
import { db } from '../db/index.js';
import { authRequired, requireRole } from './middleware.js';

const router = express.Router();

router.get('/me', authRequired, (req, res) => {
  if (req.user.role === 'teacher') {
    const p = db.prepare('SELECT * FROM teacher_profiles WHERE user_id = ?').get(req.user.id);
    if (!p) return res.json({ profile: null });
    if (p.resume_data !== undefined) delete p.resume_data; // avoid sending binary buffer
    p.resume_present = !!p.resume_mime;
    return res.json({ profile: p });
  }
  if (req.user.role === 'employer') {
    const p = db.prepare('SELECT * FROM employer_profiles WHERE user_id = ?').get(req.user.id);
    return res.json({ profile: p || null });
  }
  res.json({ profile: null });
});

router.post('/teacher', authRequired, requireRole('teacher'), (req, res) => {
  const { subjects, grades, experience_years, skills, resume_url, location, bio } = req.body;
  const existing = db.prepare('SELECT user_id FROM teacher_profiles WHERE user_id = ?').get(req.user.id);
  if (existing) return res.status(409).json({ error: 'Profile exists'});
  // Ensure undefined values are stored as NULL to satisfy better-sqlite3 bindings
  const vals = [subjects, grades, experience_years, skills, resume_url, location, bio].map(v => (v === undefined || v === '' ? null : v));
  if (vals[2] !== null) { // experience_years index 2
    const n = Number(vals[2]);
    vals[2] = Number.isFinite(n) ? n : 0;
  }
  db.prepare(`INSERT INTO teacher_profiles (user_id, subjects, grades, experience_years, skills, resume_url, location, bio) VALUES (?,?,?,?,?,?,?,?)`)
    .run(req.user.id, ...vals);
  const p = db.prepare('SELECT * FROM teacher_profiles WHERE user_id = ?').get(req.user.id);
  res.status(201).json({ profile: p });
});

router.put('/teacher', authRequired, requireRole('teacher'), (req, res) => {
  const fields = ['subjects','grades','experience_years','skills','resume_url','location','bio'];
  const updates = [];
  const params = [];
  for (const f of fields) if (f in req.body) { updates.push(`${f} = ?`); params.push(req.body[f]); }
  if (!updates.length) return res.status(400).json({ error: 'No updates'});
  params.push(req.user.id);
  db.prepare(`UPDATE teacher_profiles SET ${updates.join(', ')} WHERE user_id = ?`).run(...params);
  const p = db.prepare('SELECT * FROM teacher_profiles WHERE user_id = ?').get(req.user.id);
  res.json({ profile: p });
});

const upload = multer({
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('Unsupported file type'));
    cb(null, true);
  }
});

// Upload resume (multipart form-data: field name 'resume')
router.post('/teacher/resume', authRequired, requireRole('teacher'), upload.single('resume'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const mime = req.file.mimetype;
  const buf = req.file.buffer;
  const existing = db.prepare('SELECT user_id FROM teacher_profiles WHERE user_id = ?').get(req.user.id);
  if (!existing) {
    db.prepare('INSERT INTO teacher_profiles (user_id, resume_mime, resume_data) VALUES (?,?,?)').run(req.user.id, mime, buf);
  } else {
    db.prepare('UPDATE teacher_profiles SET resume_mime = ?, resume_data = ? WHERE user_id = ?').run(mime, buf, req.user.id);
  }
  res.json({ success: true, resume_present: true });
});

// Download resume -> binary response
router.get('/teacher/resume', authRequired, requireRole('teacher'), (req, res) => {
  const row = db.prepare('SELECT resume_mime, resume_data FROM teacher_profiles WHERE user_id = ?').get(req.user.id);
  if (!row || !row.resume_data) return res.status(404).json({ error: 'No resume uploaded'});
  res.setHeader('Content-Type', row.resume_mime || 'application/octet-stream');
  const ext = row.resume_mime === 'application/pdf' ? 'pdf' : 'dat';
  res.setHeader('Content-Disposition', `attachment; filename="resume.${ext}"`);
  res.send(row.resume_data);
});

router.post('/employer', authRequired, requireRole('employer'), (req, res) => {
  const { company_name, logo_url, industry, description, website, location } = req.body;
  if (!company_name) return res.status(400).json({ error: 'Missing company_name'});
  const existing = db.prepare('SELECT user_id FROM employer_profiles WHERE user_id = ?').get(req.user.id);
  if (existing) return res.status(409).json({ error: 'Profile exists'});
  const vals = [company_name, logo_url, industry, description, website, location].map((v,i) => (i===0 ? v : (v === undefined || v === '' ? null : v)));
  db.prepare('INSERT INTO employer_profiles (user_id, company_name, logo_url, industry, description, website, location) VALUES (?,?,?,?,?,?,?)')
    .run(req.user.id, ...vals);
  const p = db.prepare('SELECT * FROM employer_profiles WHERE user_id = ?').get(req.user.id);
  res.status(201).json({ profile: p });
});

router.put('/employer', authRequired, requireRole('employer'), (req, res) => {
  const fields = ['company_name','logo_url','industry','description','website','location'];
  const updates = [];
  const params = [];
  for (const f of fields) if (f in req.body) { updates.push(`${f} = ?`); params.push(req.body[f]); }
  if (!updates.length) return res.status(400).json({ error: 'No updates'});
  params.push(req.user.id);
  db.prepare(`UPDATE employer_profiles SET ${updates.join(', ')} WHERE user_id = ?`).run(...params);
  const p = db.prepare('SELECT * FROM employer_profiles WHERE user_id = ?').get(req.user.id);
  res.json({ profile: p });
});

export default router;
