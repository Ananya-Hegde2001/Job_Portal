import express from 'express';
import { db } from '../db/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { authRequired } from './middleware.js';

dotenv.config();

const router = express.Router();

router.post('/register', (req, res) => {
  let { email, password, role, name } = req.body;
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
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered'});
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users (email, password_hash, role, name) VALUES (?,?,?,?)')
    .run(email, hash, role, name.trim());
  const user = { id: info.lastInsertRowid, role, email, name: name.trim() };
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
  const user = { id: row.id, role: row.role, email: row.email, name: row.name };
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '2h'});
  res.json({ token, user });
});

router.get('/me', authRequired, (req, res) => {
  const row = db.prepare('SELECT id, email, role, name FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: row });
});

// Update basic account details (currently only name)
router.put('/me', authRequired, (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name required' });
  db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), req.user.id);
  const row = db.prepare('SELECT id, email, role, name FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: row });
});

export default router;
