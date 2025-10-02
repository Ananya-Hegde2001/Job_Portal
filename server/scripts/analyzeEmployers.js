import '../src/db/init.js';
import { db } from '../src/db/index.js';

const jobs = db.prepare('SELECT id, employer_id FROM jobs').all();
const employers = db.prepare("SELECT id, email FROM users WHERE role = 'employer'").all();
const profiles = db.prepare('SELECT user_id FROM employer_profiles').all();

const profileSet = new Set(profiles.map(p=>p.user_id));
const missingProfiles = employers.filter(e=>!profileSet.has(e.id));
const distinctEmployerIds = [...new Set(jobs.map(j=>j.employer_id))];
const jobCounts = distinctEmployerIds.map(id => ({ id, count: jobs.filter(j=>j.employer_id===id).length }));

console.log(JSON.stringify({
  totals: { jobs: jobs.length, employers: employers.length, employerProfiles: profiles.length },
  missingProfiles,
  jobCounts
}, null, 2));
