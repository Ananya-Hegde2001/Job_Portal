import express from 'express';
import { db } from '../db/index.js';
import { authRequired, requireRole } from './middleware.js';

const router = express.Router();

function canAccess(appRow, user) {
  if (!user) return false; return (user.role === 'teacher' && appRow.teacher_id === user.id) || (user.role === 'employer' && appRow.employer_id === user.id) || user.role === 'admin';
}

// Get full timeline: status events + messages
router.get('/applications/:id/timeline', authRequired, (req, res) => {
  const appRow = db.prepare(`SELECT a.*, j.employer_id FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.id = ?`).get(req.params.id);
  if (!appRow) return res.status(404).json({ error: 'Not found' });
  if (!canAccess(appRow, req.user)) return res.status(403).json({ error: 'Forbidden' });
  let events = db.prepare('SELECT id, type, detail, created_at FROM application_events WHERE application_id = ? ORDER BY created_at ASC').all(appRow.id);
  // Hide employer private notes from teachers for privacy
  if (req.user.role === 'teacher') {
    events = events.filter(e => e.type !== 'note');
  }
  const msgs = db.prepare('SELECT id, sender_user_id, body, created_at FROM application_messages WHERE application_id = ? ORDER BY created_at ASC').all(appRow.id);
  res.json({ events, messages: msgs });
});

// Post a message
router.post('/applications/:id/messages', authRequired, (req, res) => {
  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: 'Empty message' });
  const appRow = db.prepare(`SELECT a.*, j.employer_id FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.id = ?`).get(req.params.id);
  if (!appRow) return res.status(404).json({ error: 'Not found' });
  if (!canAccess(appRow, req.user)) return res.status(403).json({ error: 'Forbidden' });
  const info = db.prepare('INSERT INTO application_messages (application_id, sender_user_id, body) VALUES (?,?,?)').run(appRow.id, req.user.id, body.trim());
  const row = db.prepare('SELECT * FROM application_messages WHERE id = ?').get(info.lastInsertRowid);
  // Insert generic notification for other party
  try {
    const targetUser = req.user.id === appRow.teacher_id ? appRow.employer_id : appRow.teacher_id;
    db.prepare('INSERT INTO notifications (user_id, type, message) VALUES (?,?,?)')
      .run(targetUser, 'application_message', `New message on application #${appRow.id}`);
  } catch {}
  res.status(201).json({ message: row });
});

// Employer private note (not visible to teacher)
router.post('/applications/:id/notes', authRequired, requireRole('employer','admin'), (req, res) => {
  const { note } = req.body;
  if (!note || !note.trim()) return res.status(400).json({ error: 'Empty note' });
  const appRow = db.prepare(`SELECT a.*, j.employer_id FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.id = ?`).get(req.params.id);
  if (!appRow) return res.status(404).json({ error: 'Not found' });
  if (req.user.role === 'employer' && appRow.employer_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  db.prepare('INSERT INTO application_events (application_id, type, detail) VALUES (?,?,?)').run(appRow.id, 'note', note.trim());
  res.status(201).json({ ok: true });
});

export default router;
