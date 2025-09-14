import { db } from './index.js';

db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);

const migrations = [
  {
    id: '20240914_add_job_extended_fields',
    up: () => {
      const cols = db.prepare('PRAGMA table_info(jobs)').all().map(c => c.name);
      const add = (name, type) => { if (!cols.includes(name)) db.exec(`ALTER TABLE jobs ADD COLUMN ${name} ${type}`); };
      add('organization_type','TEXT');
      add('institution_name','TEXT');
      add('employment_type','TEXT');
      add('min_experience','INTEGER DEFAULT 0');
      add('education_required','TEXT');
      add('skills_required','TEXT');
      add('application_deadline','TEXT');
      add('responsibilities','TEXT');
      add('requirements','TEXT');
      add('pay_scale','TEXT');
      add('benefits','TEXT');
      add('organization_website','TEXT');
      add('city','TEXT');
      add('remote_allowed','INTEGER DEFAULT 0');
      add('department','TEXT');
    }
  },
  {
    id: '20250914_add_teacher_resume_columns',
    up: () => {
      const teacherCols = db.prepare('PRAGMA table_info(teacher_profiles)').all();
      const names = teacherCols.map(c => c.name);
      if (!names.includes('resume_mime')) db.prepare('ALTER TABLE teacher_profiles ADD COLUMN resume_mime TEXT').run();
      if (!names.includes('resume_data')) db.prepare('ALTER TABLE teacher_profiles ADD COLUMN resume_data BLOB').run();
    }
  },
  {
    id: '20250914_add_user_phone_column',
    up: () => {
      const userCols = db.prepare('PRAGMA table_info(users)').all().map(c => c.name);
      if (!userCols.includes('phone')) db.prepare('ALTER TABLE users ADD COLUMN phone TEXT').run();
    }
  },
  {
    id: '20250914_add_user_reset_columns',
    up: () => {
      const userCols = db.prepare('PRAGMA table_info(users)').all().map(c => c.name);
      if (!userCols.includes('reset_token')) db.prepare('ALTER TABLE users ADD COLUMN reset_token TEXT').run();
      if (!userCols.includes('reset_expires')) db.prepare('ALTER TABLE users ADD COLUMN reset_expires INTEGER').run();
    }
  }
];

for (const m of migrations) {
  const exists = db.prepare('SELECT 1 FROM schema_migrations WHERE id = ?').get(m.id);
  if (!exists) {
    m.up();
    db.prepare('INSERT INTO schema_migrations (id) VALUES (?)').run(m.id);
    console.log('Applied migration', m.id);
  }
}

console.log('Migrations complete.');