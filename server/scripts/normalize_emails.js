import '../src/db/index.js';
import { db } from '../src/db/index.js';

const users = db.prepare('SELECT id, email FROM users').all();
let changed = 0;
for (const u of users) {
  const lower = u.email.trim().toLowerCase();
  if (lower !== u.email) {
    try {
      db.prepare('UPDATE users SET email = ? WHERE id = ?').run(lower, u.id);
      changed++;
    } catch (e) {
      console.error('Could not normalize email for id', u.id, e.message);
    }
  }
}
console.log(`Normalized ${changed} emails.`);
