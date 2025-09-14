import { db } from '../src/db/index.js';
const rows = db.prepare('SELECT id,email,role FROM users WHERE role != ?').all('admin');
console.log(rows);
