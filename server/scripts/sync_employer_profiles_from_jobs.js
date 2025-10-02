import '../src/db/init.js';
import { db } from '../src/db/index.js';

// For each employer that owns at least one job, set employer_profiles.company_name from first job's institution_name if present.
// Also map organization_type -> industry if industry currently null.

const employers = db.prepare(`SELECT DISTINCT employer_id FROM jobs`).all();
if(!employers.length){
  console.log('No jobs found.');
  process.exit(0);
}

const getJob = db.prepare('SELECT institution_name, organization_type, city, location, organization_website FROM jobs WHERE employer_id = ? ORDER BY id LIMIT 1');
const ensureProfile = db.prepare('SELECT user_id FROM employer_profiles WHERE user_id = ?');
const insertProfile = db.prepare('INSERT INTO employer_profiles (user_id, company_name, logo_url, industry, description, website, location) VALUES (?,?,?,?,?,?,?)');
const updateProfile = db.prepare('UPDATE employer_profiles SET company_name = COALESCE(?, company_name), industry = COALESCE(?, industry), website = COALESCE(?, website), location = COALESCE(?, location) WHERE user_id = ?');

let updated = 0;
for(const { employer_id } of employers){
  const job = getJob.get(employer_id);
  if(!job) continue;
  let profile = ensureProfile.get(employer_id);
  if(!profile){
    insertProfile.run(employer_id, job.institution_name || `Institution ${employer_id}`, null, job.organization_type || 'Education', `Auto-synced profile for employer ${employer_id}`, job.organization_website || null, job.city || job.location || null);
    updated++;
    continue;
  }
  updateProfile.run(job.institution_name || null, job.organization_type || null, job.organization_website || null, job.city || job.location || null, employer_id);
  updated++;
}

console.log('Synced employer profiles for', updated, 'employers.');
