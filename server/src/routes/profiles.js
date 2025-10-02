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
    if (p.avatar_data !== undefined) delete p.avatar_data;
    p.resume_present = !!p.resume_mime;
    p.avatar_present = !!p.avatar_mime;
    // Parse JSON fields safely
  const jsonFields = ['top_skills_json','certificates_json','experience_json','education_json'];
    for (const f of jsonFields) {
      if (p[f]) {
        try { p[f.replace('_json','')] = JSON.parse(p[f]); } catch (_) { p[f.replace('_json','')] = null; }
      } else {
        p[f.replace('_json','')] = null;
      }
      delete p[f];
    }
    // Backward-compat: derive top_skills from legacy comma string if JSON absent
    if ((!p.top_skills || !Array.isArray(p.top_skills)) && typeof p.skills === 'string' && p.skills.trim()) {
      p.top_skills = p.skills.split(',').map(s=>s.trim()).filter(Boolean);
    }
    return res.json({ profile: p });
  }
  if (req.user.role === 'employer') {
    const p = db.prepare('SELECT * FROM employer_profiles WHERE user_id = ?').get(req.user.id);
    return res.json({ profile: p || null });
  }
  res.json({ profile: null });
});

router.post('/teacher', authRequired, requireRole('teacher'), (req, res) => {
  // Accept both legacy resume_url and new linkedin_url; prefer explicit linkedin_url
  const { subjects, grades, experience_years, skills, linkedin_url, resume_url, location, bio, gender, work_status } = req.body;
  const existing = db.prepare('SELECT user_id FROM teacher_profiles WHERE user_id = ?').get(req.user.id);
  if (existing) return res.status(409).json({ error: 'Profile exists'});
  // Ensure undefined values are stored as NULL to satisfy better-sqlite3 bindings
  const finalLinked = (linkedin_url || resume_url) || null;
  const g = (gender === 'male' || gender === 'female') ? gender : null;
  const ws = (work_status === 'experienced' || work_status === 'fresher') ? work_status : null;
  const vals = [subjects, grades, experience_years, skills, g, ws, finalLinked, location, bio].map(v => (v === undefined || v === '' ? null : v));
  if (vals[2] !== null) { // experience_years index 2
    const n = Number(vals[2]);
    vals[2] = Number.isFinite(n) ? n : 0;
  }
  // Prepare JSON fields if present
  let top_skills_json = null, certificates_json = null, experience_json = null, education_json = null;
  const tryStringify = (v) => {
    if (v == null) return null;
    try { return JSON.stringify(v); } catch { return null; }
  };
  if ('top_skills' in req.body) top_skills_json = tryStringify(req.body.top_skills);
  if ('certificates' in req.body) certificates_json = tryStringify(req.body.certificates);
  if ('experience' in req.body) experience_json = tryStringify(req.body.experience);
  if ('education' in req.body) education_json = tryStringify(req.body.education);
  db.prepare(`INSERT INTO teacher_profiles (user_id, subjects, grades, experience_years, skills, gender, work_status, linkedin_url, location, bio, top_skills_json, certificates_json, experience_json, education_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(req.user.id, ...vals, top_skills_json, certificates_json, experience_json, education_json);
  const p = db.prepare('SELECT * FROM teacher_profiles WHERE user_id = ?').get(req.user.id);
  res.status(201).json({ profile: p });
});

router.put('/teacher', authRequired, requireRole('teacher'), (req, res) => {
  // Support legacy resume_url in incoming payload
  if ('resume_url' in req.body && !('linkedin_url' in req.body)) {
    req.body.linkedin_url = req.body.resume_url;
    delete req.body.resume_url;
  }
  const fields = ['subjects','grades','experience_years','skills','gender','work_status','linkedin_url','location','bio'];
  const updates = [];
  const params = [];
  for (const f of fields) if (f in req.body) {
    if (f === 'gender') {
      const val = (req.body.gender === 'male' || req.body.gender === 'female') ? req.body.gender : null;
      updates.push(`${f} = ?`);
      params.push(val);
    } else if (f === 'work_status') {
      const val = (req.body.work_status === 'experienced' || req.body.work_status === 'fresher') ? req.body.work_status : null;
      updates.push(`${f} = ?`);
      params.push(val);
    } else {
      updates.push(`${f} = ?`);
      params.push(req.body[f]);
    }
  }
  // Accept rich JSON sections
  const jsonMap = [
    ['top_skills','top_skills_json'],
    ['certificates','certificates_json'],
    ['experience','experience_json'],
    ['education','education_json'],
  ];
  for (const [inKey, col] of jsonMap) {
    if (inKey in req.body) {
      let val = req.body[inKey];
      try {
        if (typeof val !== 'string') val = JSON.stringify(val);
        // Validate JSON by parsing
        JSON.parse(val);
      } catch (e) {
        return res.status(400).json({ error: `Invalid JSON for ${inKey}` });
      }
      updates.push(`${col} = ?`);
      params.push(val);
    }
  }
  if (!updates.length) return res.status(400).json({ error: 'No updates'});
  params.push(req.user.id);
  db.prepare(`UPDATE teacher_profiles SET ${updates.join(', ')} WHERE user_id = ?`).run(...params);
  const p = db.prepare('SELECT * FROM teacher_profiles WHERE user_id = ?').get(req.user.id);
  // Provide backward-compatible alias in response if consumer still expects resume_url
  if (p && p.linkedin_url && !p.resume_url) p.resume_url = p.linkedin_url;
  if (p.resume_data !== undefined) delete p.resume_data;
  if (p.avatar_data !== undefined) delete p.avatar_data;
  p.resume_present = !!p.resume_mime;
  p.avatar_present = !!p.avatar_mime;
  const jsonFields = ['top_skills_json','certificates_json','experience_json','education_json'];
  for (const f of jsonFields) {
    if (p[f]) {
      try { p[f.replace('_json','')] = JSON.parse(p[f]); } catch (_) { p[f.replace('_json','')] = null; }
    } else {
      p[f.replace('_json','')] = null;
    }
    delete p[f];
  }
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

// Avatar upload (field name 'avatar', accept common image types)
const avatarUpload = multer({
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png','image/jpeg','image/webp'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('Unsupported image type'));
    cb(null, true);
  }
});

router.post('/teacher/avatar', authRequired, requireRole('teacher'), avatarUpload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const mime = req.file.mimetype;
  const buf = req.file.buffer;
  const existing = db.prepare('SELECT user_id FROM teacher_profiles WHERE user_id = ?').get(req.user.id);
  if (!existing) {
    db.prepare('INSERT INTO teacher_profiles (user_id, avatar_mime, avatar_data) VALUES (?,?,?)').run(req.user.id, mime, buf);
  } else {
    db.prepare('UPDATE teacher_profiles SET avatar_mime = ?, avatar_data = ? WHERE user_id = ?').run(mime, buf, req.user.id);
  }
  res.json({ success: true, avatar_present: true });
});

router.get('/teacher/avatar', authRequired, requireRole('teacher'), (req, res) => {
  const row = db.prepare('SELECT avatar_mime, avatar_data FROM teacher_profiles WHERE user_id = ?').get(req.user.id);
  if (!row || !row.avatar_data) return res.status(404).json({ error: 'No avatar uploaded'});
  res.setHeader('Content-Type', row.avatar_mime || 'application/octet-stream');
  res.setHeader('Content-Disposition', 'inline; filename="avatar"');
  res.send(row.avatar_data);
});

router.delete('/teacher/avatar', authRequired, requireRole('teacher'), (req, res) => {
  db.prepare('UPDATE teacher_profiles SET avatar_mime = NULL, avatar_data = NULL WHERE user_id = ?').run(req.user.id);
  res.json({ success: true });
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
