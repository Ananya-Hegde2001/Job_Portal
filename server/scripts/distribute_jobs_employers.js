import '../src/db/init.js';
import { db } from '../src/db/index.js';
import bcrypt from 'bcryptjs';

const BASE_EMAIL_PREFIX = 'school';
const START_INDEX = 3; // school3 ...
const COUNT = 31; // total distinct employers desired
const PASSWORD = 'password123';

// Fetch all jobs
const jobs = db.prepare('SELECT id FROM jobs ORDER BY id ASC').all();
if (jobs.length === 0) {
  console.log('No jobs present. Seed jobs first.');
  process.exit(0);
}

if (jobs.length < COUNT) {
  console.log(`Warning: Only ${jobs.length} jobs but requested ${COUNT} employers. Some employers will have no job.`);
}

// Create or fetch employers
const createdEmployers = [];
const hash = bcrypt.hashSync(PASSWORD, 10);
for (let i = 0; i < COUNT; i++) {
  const idx = START_INDEX + i; // 3 .. 33 inclusive for 31 employers
  const email = `${BASE_EMAIL_PREFIX}${idx}@gmail.com`;
  let user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (!user) {
    const info = db.prepare('INSERT INTO users (email, password_hash, role, name) VALUES (?,?,?,?)')
      .run(email, hash, 'employer', `School ${idx}`);
    user = { id: info.lastInsertRowid };
    console.log('Created employer user:', email);
  } else {
    console.log('Existing employer user found:', email);
  }
  // Ensure profile
  const prof = db.prepare('SELECT user_id FROM employer_profiles WHERE user_id = ?').get(user.id);
  if (!prof) {
    db.prepare('INSERT INTO employer_profiles (user_id, company_name, logo_url, industry, description, website, location) VALUES (?,?,?,?,?,?,?)')
      .run(user.id, `School ${idx}`, null, 'Education', `Auto-generated profile for School ${idx}`, null, 'Unknown');
  }
  createdEmployers.push({ id: user.id, email });
}

// Assign jobs one per employer sequentially (if more jobs than employers, wrap)
const update = db.prepare('UPDATE jobs SET employer_id = ? WHERE id = ?');
for (let j = 0; j < jobs.length; j++) {
  const employer = createdEmployers[j % createdEmployers.length];
  update.run(employer.id, jobs[j].id);
}

console.log('Distribution complete. Credentials list below:');
console.log(JSON.stringify({ password: PASSWORD, employers: createdEmployers }, null, 2));
