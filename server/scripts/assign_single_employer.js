import '../src/db/init.js';
import { db } from '../src/db/index.js';
import bcrypt from 'bcryptjs';

// Configuration
const EMAIL = 'school3@gmail.com';
const PASSWORD = 'password123';
const EMPLOYER_NAME = 'School 3';

// 1. Ensure user exists or create
let employer = db.prepare("SELECT id FROM users WHERE email = ?").get(EMAIL);
if(!employer){
  const hash = bcrypt.hashSync(PASSWORD,10);
  const info = db.prepare('INSERT INTO users (email, password_hash, role, name) VALUES (?,?,?,?)')
    .run(EMAIL, hash, 'employer', EMPLOYER_NAME);
  employer = { id: info.lastInsertRowid };
  console.log('Created employer user:', EMAIL);
}else{
  console.log('Employer user already exists:', EMAIL);
}

// 2. Ensure employer profile exists
let profile = db.prepare('SELECT user_id FROM employer_profiles WHERE user_id = ?').get(employer.id);
if(!profile){
  db.prepare('INSERT INTO employer_profiles (user_id, company_name, logo_url, industry, description, website, location) VALUES (?,?,?,?,?,?,?)')
    .run(employer.id, 'School 3 Institution', null, 'Education', 'Auto-generated profile for School 3', null, 'Unknown');
  console.log('Created employer profile for user', employer.id);
}else{
  console.log('Employer profile already exists for user', employer.id);
}

// 3. Reassign all jobs to this employer
const jobs = db.prepare('SELECT id, employer_id FROM jobs').all();
if(!jobs.length){
  console.log('No jobs found to reassign.');
  process.exit(0);
}
const update = db.prepare('UPDATE jobs SET employer_id = ? WHERE id = ?');
const tx = db.transaction(()=>{
  for(const j of jobs){
    if(j.employer_id !== employer.id){
      update.run(employer.id, j.id);
    }
  }
});
tx();

const reassigned = db.prepare('SELECT COUNT(*) as c FROM jobs WHERE employer_id = ?').get(employer.id).c;
console.log(`Reassigned ${reassigned} jobs to employer ${EMAIL} (id=${employer.id}).`);
console.log('Credentials:\nEmail:', EMAIL, '\nPassword:', PASSWORD);
