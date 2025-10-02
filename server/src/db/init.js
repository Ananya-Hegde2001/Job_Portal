import './index.js';
import { db } from './index.js';
import bcrypt from 'bcryptjs';

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('teacher','employer','admin')),
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teacher_profiles (
  user_id INTEGER PRIMARY KEY,
  subjects TEXT,
  grades TEXT,
  experience_years INTEGER DEFAULT 0,
  skills TEXT,
  gender TEXT CHECK(gender IN ('male','female')),
  work_status TEXT CHECK(work_status IN ('experienced','fresher')),
  linkedin_url TEXT,
  location TEXT,
  bio TEXT,
  -- Rich profile fields
  top_skills_json TEXT, -- JSON array of strings
  certificates_json TEXT, -- JSON array of {title, issuer, year, url}
  experience_json TEXT, -- JSON array of {title, organization, start, end, description, location}
  education_json TEXT, -- JSON array of {level, institute, degree, start, end, grade}
  -- Binary avatar support
  avatar_mime TEXT,
  avatar_data BLOB,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS employer_profiles (
  user_id INTEGER PRIMARY KEY,
  company_name TEXT NOT NULL,
  logo_url TEXT,
  industry TEXT,
  description TEXT,
  website TEXT,
  location TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employer_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  subject TEXT,
  grade_level TEXT,
  location TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  organization_type TEXT,
  institution_name TEXT,
  employment_type TEXT,
  min_experience INTEGER DEFAULT 0,
  education_required TEXT,
  skills_required TEXT,
  application_deadline TEXT,
  responsibilities TEXT,
  requirements TEXT,
  pay_scale TEXT,
  benefits TEXT,
  organization_website TEXT,
  city TEXT,
  remote_allowed INTEGER DEFAULT 0,
  department TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','closed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(employer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  cover_letter TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','shortlisted','rejected','hired')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(job_id, teacher_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Reviews that teachers leave for institutions/colleges
CREATE TABLE IF NOT EXISTS institution_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL,
  institution_key TEXT NOT NULL, -- normalized key (usually lowercased name)
  institution_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Generic feedback / support messages (optionally anonymous if no user)
CREATE TABLE IF NOT EXISTS feedback_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  email TEXT,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Saved jobs (teacher bookmarks)
CREATE TABLE IF NOT EXISTS saved_jobs (
  user_id INTEGER NOT NULL,
  job_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id, job_id),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Job alert subscriptions (simple subject/location filters)
CREATE TABLE IF NOT EXISTS job_alert_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  subject TEXT,
  location TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Application events timeline (status changes, notes)
CREATE TABLE IF NOT EXISTS application_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  detail TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(application_id) REFERENCES applications(id) ON DELETE CASCADE
);

-- Application messages (two-way communication)
CREATE TABLE IF NOT EXISTS application_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  sender_user_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  read_by_employer INTEGER NOT NULL DEFAULT 0,
  read_by_teacher INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY(sender_user_id) REFERENCES users(id) ON DELETE CASCADE
);
`;

db.exec(schema);

// Seed admin if not exists
const adminExists = db.prepare('SELECT 1 FROM users WHERE role = ? LIMIT 1').get('admin');
if (!adminExists) {
  try {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (email, password_hash, role, name) VALUES (?,?,?,?)')
      .run('admin@portal.local', hash, 'admin', 'Administrator');
    console.log('Seeded default admin: admin@portal.local / admin123');
  } catch (e) {
    console.error('Failed to seed admin user:', e.message);
  }
}

console.log('Database initialized.');

// Idempotent migrations for missing auth-related columns (phone, reset_token, reset_expires)
try {
  const userCols = db.prepare("PRAGMA table_info(users)").all();
  const names = userCols.map(c => c.name);
  const alters = [];
  if (!names.includes('phone')) alters.push("ALTER TABLE users ADD COLUMN phone TEXT");
  if (!names.includes('reset_token')) alters.push("ALTER TABLE users ADD COLUMN reset_token TEXT");
  if (!names.includes('reset_expires')) alters.push("ALTER TABLE users ADD COLUMN reset_expires INTEGER");
  for (const sql of alters) {
    try { db.exec(sql); console.log('Applied migration:', sql); } catch (e) { console.warn('Migration failed:', sql, e.message); }
  }
} catch (e) {
  console.warn('Failed to run column migrations:', e.message);
}
