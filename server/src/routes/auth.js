import express from 'express';
import { db } from '../db/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { authRequired } from './middleware.js';
import crypto from 'crypto';

dotenv.config();

const router = express.Router();

router.post('/register', (req, res) => {
  let { email, password, role, name, phone } = req.body;
  if (!email || !password || !role || !name) return res.status(400).json({ error: 'Missing fields'});
  email = String(email).trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Invalid email'});
  // Enforce approved domains (currently only gmail.com)
  const allowedDomains = ['gmail.com'];
  const domain = email.split('@')[1];
  if (!allowedDomains.includes(domain)) {
    return res.status(400).json({ error: 'Email domain not allowed (use gmail.com)'});
  }
  if (password.length < 6) return res.status(400).json({ error: 'Password too short'});
  if (!['teacher','employer'].includes(role)) return res.status(400).json({ error: 'Invalid role'});
  if (phone != null) {
    phone = String(phone).trim();
    if (phone && !/^\d{10}$/.test(phone)) return res.status(400).json({ error: 'Invalid phone number'});
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered'});
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users (email, password_hash, role, name, phone) VALUES (?,?,?,?,?)')
    .run(email, hash, role, name.trim(), phone || null);
  const user = { id: info.lastInsertRowid, role, email, name: name.trim(), phone: phone || null };
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '2h'});
  res.json({ token, user });
});

router.post('/login', (req, res) => {
  let { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email & password required'});
  email = String(email).trim().toLowerCase();
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!row) return res.status(401).json({ error: 'Invalid credentials'});
  const ok = bcrypt.compareSync(password, row.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials'});
  const user = { id: row.id, role: row.role, email: row.email, name: row.name, phone: row.phone };
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '2h'});
  res.json({ token, user });
});

router.get('/me', authRequired, (req, res) => {
  const row = db.prepare('SELECT id, email, role, name, phone FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: row });
});

// Update basic account details (currently only name)
router.put('/me', authRequired, (req, res) => {
  const { name, phone } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name required' });
  let phoneVal = phone == null ? null : String(phone).trim();
  if (phoneVal && !/^\d{10}$/.test(phoneVal)) return res.status(400).json({ error: 'Invalid phone number'});
  db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?').run(name.trim(), phoneVal || null, req.user.id);
  const row = db.prepare('SELECT id, email, role, name, phone FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: row });
});

// Request password reset: generates a token (shown directly in response for now)
router.post('/forgot', (req, res) => {
  let { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  email = String(email).trim().toLowerCase();
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (!user) {
    // Do not reveal user existence
    return res.json({ message: 'If the email exists, a reset token has been generated.' });
  }
  const token = crypto.randomBytes(24).toString('hex');
  const expires = Date.now() + (1000 * 60 * 15); // 15 minutes
  db.prepare('UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?').run(token, expires, user.id);
  // In production: send email here
  res.json({ message: 'Reset token generated', token, expires });
});

// Reset password using token
router.post('/reset', (req, res) => {
  let { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and new password required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password too short' });
  const now = Date.now();
  const user = db.prepare('SELECT id FROM users WHERE reset_token = ? AND reset_expires >= ?').get(token, now);
  if (!user) return res.status(400).json({ error: 'Invalid or expired token' });
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?').run(hash, user.id);
  res.json({ message: 'Password updated successfully' });
});

export default router;
