import { db } from '../src/db/index.js';

const rows = db.prepare('SELECT id,email FROM users WHERE role != ?').all('admin');
let changed = 0;
for (const r of rows) {
  if (/@example\.com$/i.test(r.email)) {
    const local = r.email.split('@')[0];
    const newEmail = local + '@gmail.com';
    // Ensure no collision
    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(newEmail);
    if (exists) {
      console.log('Skip (collision):', r.email, '->', newEmail);
      continue;
    }
    db.prepare('UPDATE users SET email = ? WHERE id = ?').run(newEmail, r.id);
    changed++;
    console.log('Updated:', r.email, '->', newEmail);
  }
}
console.log('Done. Updated', changed, 'emails.');
