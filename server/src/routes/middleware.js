import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { db } from '../db/index.js';

dotenv.config();

export function authRequired(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token'});
  try {
    const token = auth.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token'});
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized'});
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden'});
    next();
  };
}

export function loadUser(req, res, next) {
  if (!req.user) return next();
  const row = db.prepare('SELECT id, email, role, name FROM users WHERE id = ?').get(req.user.id);
  if (!row) return res.status(401).json({ error: 'User not found'});
  req.user.full = row;
  next();
}
