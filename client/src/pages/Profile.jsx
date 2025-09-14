import { useEffect, useState } from 'react';
import { api } from '../util/api.js';
import { showToast } from '../util/toast.js';
import { useAuth } from '../state/AuthContext.jsx';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [data, setData] = useState(null);
  const [form, setForm] = useState({});
  const isTeacher = user.role === 'teacher';
  const isAdmin = user.role === 'admin';
  const [name, setName] = useState(user.name || '');
  useEffect(() => { api.get('/profiles/me').then(r => { setData(r.profile); setForm(r.profile || {}); }); }, []);
  function onChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }
  function save() {
    const path = isTeacher ? '/profiles/teacher' : '/profiles/employer';
    const method = data ? 'put' : 'post';
    const payload = { ...form };
    if (isTeacher && payload.experience_years) {
      const n = Number(payload.experience_years);
      if (!Number.isFinite(n)) payload.experience_years = 0; else payload.experience_years = n;
    }
    // First update base account name if changed
    const namePromise = name !== user.name ? api.put('/auth/me', { name }) : Promise.resolve({ user });
    namePromise
      .then(resp => { if (resp.user) setUser(prev => ({ ...prev, name: resp.user.name })); return api[method](path, payload); })
      .then(r => { setData(r.profile); showToast('Profile saved','success'); })
      .catch(e => { showToast(e.message || 'Save failed','error'); });
  }
  return (
    <div style={{ maxWidth: 820 }}>
      {isAdmin && (
        <div style={{
          background: 'var(--surface)',
          padding: '1rem 1.1rem',
          border: '1px solid var(--border-subtle)',
          borderRadius: '.55rem',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Administrator Overview</h2>
          <p className="muted" style={{ margin: '.4rem 0 .9rem', fontSize: '.7rem', lineHeight: 1.4 }}>
            This admin account can review, publish or remove any job posting, and view / moderate all applications. Use it only for platform moderation and configuration tasks.
          </p>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '.65rem', lineHeight: 1.55 }}>
            <li>Approve or remove jobs (draft / pending / approved)</li>
            <li>View all applications & update their statuses</li>
            <li>Bypass employer ownership restrictions on edits</li>
            <li>Seeded dev credential: <code>admin@portal.local</code></li>
            <li style={{ listStyle: 'none', marginTop: '.55rem' }}>
              <span style={{ display: 'inline-block', background: 'var(--accent-glow)', color: 'var(--text)', padding: '.3rem .55rem', borderRadius: '.4rem', fontSize: '.6rem' }}>
                Reminder: Change this password before production
              </span>
            </li>
          </ul>
        </div>
      )}
      {!isAdmin && (
        <>
          <h2 style={{ marginBottom: '.25rem' }}>{isTeacher ? 'Teacher' : 'Employer'} Profile</h2>
          <p className="muted" style={{ marginTop: 0, marginBottom: '1.4rem' }}>{isTeacher ? 'Showcase expertise & teaching focus.' : 'Describe your institution & open roles focus.'}</p>
        </>
      )}
      <div style={{ marginBottom:'1rem', maxWidth:420 }}>
        <label style={{ fontSize: '.65rem' }}>Full Name</label>
        <input name="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" />
      </div>
      {isTeacher ? (
        <div className="grid" style={{ gap: '1rem' }}>
          <div style={{ display:'grid', gap:'1rem', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))' }}>
            <div>
              <label style={{ fontSize: '.65rem' }}>Subjects</label>
              <input name="subjects" placeholder="Math, Physics" value={form.subjects||''} onChange={onChange} />
            </div>
            <div>
              <label style={{ fontSize: '.65rem' }}>Grades</label>
              <input name="grades" placeholder="6-8" value={form.grades||''} onChange={onChange} />
            </div>
            <div>
              <label style={{ fontSize: '.65rem' }}>Experience Years</label>
              <input name="experience_years" placeholder="5" value={form.experience_years||''} onChange={onChange} />
            </div>
            <div>
              <label style={{ fontSize: '.65rem' }}>Location</label>
              <input name="location" placeholder="City / Remote" value={form.location||''} onChange={onChange} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '.65rem' }}>Skills</label>
            <input name="skills" placeholder="STEM, Classroom Management" value={form.skills||''} onChange={onChange} />
          </div>
          <div>
            <label style={{ fontSize: '.65rem' }}>Resume URL</label>
            <input name="resume_url" placeholder="https://..." value={form.resume_url||''} onChange={onChange} />
          </div>
          <div>
            <label style={{ fontSize: '.65rem' }}>Bio</label>
            <textarea name="bio" placeholder="Passionate about learner-centered pedagogy" value={form.bio||''} onChange={onChange} />
          </div>
        </div>
      ) : (
        <div className="grid" style={{ gap: '1rem' }}>
          <div style={{ display:'grid', gap:'1rem', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))' }}>
            <div>
              <label style={{ fontSize: '.65rem' }}>University Name</label>
              <input name="company_name" placeholder="Springfield High" value={form.company_name||''} onChange={onChange} />
            </div>
            <div>
              <label style={{ fontSize: '.65rem' }}>Industry</label>
              <input name="industry" placeholder="Education" value={form.industry||''} onChange={onChange} />
            </div>
            <div>
              <label style={{ fontSize: '.65rem' }}>Website</label>
              <input name="website" placeholder="https://..." value={form.website||''} onChange={onChange} />
            </div>
            <div>
              <label style={{ fontSize: '.65rem' }}>Location</label>
              <input name="location" placeholder="City / Remote" value={form.location||''} onChange={onChange} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '.65rem' }}>Logo URL</label>
            <input name="logo_url" placeholder="https://..." value={form.logo_url||''} onChange={onChange} />
          </div>
          <div>
            <label style={{ fontSize: '.65rem' }}>Description</label>
            <textarea name="description" placeholder="School culture, values, programs" value={form.description||''} onChange={onChange} />
          </div>
        </div>
      )}
      <div style={{ marginTop: '1.4rem' }}>
        <button className="btn" onClick={save}>Save Profile</button>
      </div>
    </div>
  );
}
