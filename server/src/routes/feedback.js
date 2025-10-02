import express from 'express';
import { db } from '../db/index.js';
import { maybeAuth } from './middleware.js';

const router = express.Router();

// POST /api/feedback { email, message }
router.post('/', maybeAuth, (req, res) => {
  const { email, message } = req.body || {};
  if (!message || typeof message !== 'string' || message.trim().length < 5) {
    return res.status(400).json({ error: 'Message too short' });
  }
  const cleanEmail = (email && typeof email === 'string' && email.includes('@')) ? email.trim().slice(0,120) : null;
  try {
    const info = db.prepare('INSERT INTO feedback_messages (user_id, email, message) VALUES (?,?,?)')
      .run(req.user ? req.user.id : null, cleanEmail, message.trim());
    res.status(201).json({ success: true, id: info.lastInsertRowid });
  } catch (e) {
    console.error('Failed to store feedback', e.message);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

export default router;
