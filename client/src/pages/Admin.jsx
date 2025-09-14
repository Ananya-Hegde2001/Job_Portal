import { useEffect, useState, useMemo } from 'react';
import { api } from '../util/api.js';
import { showToast } from '../util/toast.js';

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'applications', label: 'Applications' },
  { key: 'users', label: 'Users' }
];

export default function Admin() {
  const [active, setActive] = useState('overview');
  const [summary, setSummary] = useState(null);
  const [jobFilter, setJobFilter] = useState('pending');
  const [jobs, setJobs] = useState([]);
  const [jobSearch, setJobSearch] = useState('');
  const [apps, setApps] = useState([]);
  const [appFilterStatus, setAppFilterStatus] = useState('');
  const [appJobId, setAppJobId] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');

  function loadSummary() {
    api.get('/admin/summary').then(r => setSummary(r));
  }
  function loadJobs() {
    setLoading(true);
    const params = new URLSearchParams();
    if (jobFilter) params.append('status', jobFilter);
    if (jobSearch) params.append('q', jobSearch);
    api.get('/admin/jobs?' + params.toString()).then(r => { setJobs(r.jobs); setLoading(false); });
  }
  function loadApplications() {
    setLoading(true);
    const params = new URLSearchParams();
    if (appFilterStatus) params.append('status', appFilterStatus);
    if (appJobId) params.append('job_id', appJobId);
    api.get('/admin/applications?' + params.toString()).then(r => { setApps(r.applications); setLoading(false); });
  }

  useEffect(() => { if (active === 'overview') loadSummary(); }, [active]);
  useEffect(() => { if (active === 'jobs') loadJobs(); }, [active, jobFilter]);
  useEffect(() => { if (active === 'applications') loadApplications(); }, [active, appFilterStatus]);
  useEffect(() => { if (active === 'users') loadUsers(); }, [active, userRoleFilter]);

  function changeJobStatus(id, status) {
    api.put(`/admin/jobs/${id}/status`, { status })
      .then(r => {
        setJobs(prev => prev.map(j => j.id === id ? r.job : j));
        showToast('Job updated','success');
        loadSummary();
      })
      .catch(e => showToast(e.message || 'Update failed','error'));
  }

  function changeAppStatus(id, status) {
    api.put(`/admin/applications/${id}/status`, { status })
      .then(r => {
        setApps(prev => prev.map(a => a.id === id ? r.application : a));
        showToast('Application updated','success');
        loadSummary();
      })
      .catch(e => showToast(e.message || 'Update failed','error'));
  }

  function loadUsers() {
    setLoading(true);
    const params = new URLSearchParams();
    if (userRoleFilter) params.append('role', userRoleFilter);
    if (userSearch) params.append('q', userSearch);
    api.get('/admin/users?' + params.toString())
      .then(r => { setUsers(r.users); setLoading(false); })
      .catch(e => { showToast(e.message,'error'); setLoading(false); });
  }

  const statLookup = useMemo(() => {
    if (!summary) return { users:{}, jobs:{}, applications:{} };
    const toObj = (arr=[]) => arr.reduce((acc, r) => (acc[r.role||r.status]=r.count, acc), {});
    return {
      users: toObj(summary.users),
      jobs: toObj(summary.jobs),
      applications: toObj(summary.applications)
    };
  }, [summary]);

  return (
    <div style={{ maxWidth: 1180 }}>
      <h2 style={{ marginBottom: '.75rem' }}>Admin Dashboard</h2>
      <div style={{ display: 'flex', gap: '.4rem', marginBottom: '1.2rem' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActive(t.key)} className={active===t.key ? 'tab-active' : 'tab'}>{t.label}</button>
        ))}
      </div>
      {active === 'overview' && (
        <div style={{ display:'grid', gap:'1.2rem' }}>
          {!summary && <p className="muted">Loading summary...</p>}
          {summary && (
            <>
              <div style={{ display:'grid', gap:'1rem', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))' }}>
                <StatCard label="Teachers" value={statLookup.users.teacher||0} />
                <StatCard label="Employers" value={statLookup.users.employer||0} />
                <StatCard label="Admins" value={statLookup.users.admin||0} />
                <StatCard label="Jobs Pending" value={statLookup.jobs.pending||0} />
                <StatCard label="Jobs Approved" value={statLookup.jobs.approved||0} />
                <StatCard label="Jobs Rejected" value={statLookup.jobs.rejected||0} />
                <StatCard label="Apps Submitted" value={statLookup.applications.submitted||0} />
                <StatCard label="Apps Shortlisted" value={statLookup.applications.shortlisted||0} />
                <StatCard label="Apps Hired" value={statLookup.applications.hired||0} />
              </div>
              <div style={{ display:'grid', gap:'1.5rem', gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))' }}>
                <Panel title="Recent Jobs">
                  {summary.recentJobs.length === 0 && <p className="muted" style={{ fontSize: '.65rem' }}>No jobs yet.</p>}
                  {summary.recentJobs.map(j => (
                    <div key={j.id} className="row-line">
                      <div>
                        <strong style={{ fontSize: '.7rem' }}>{j.title}</strong>
                        <div className="muted" style={{ fontSize: '.6rem' }}>{j.status}</div>
                      </div>
                      <div style={{ display:'flex', gap:'.25rem' }}>
                        {j.status !== 'approved' && <button className="pill-btn" onClick={() => changeJobStatus(j.id,'approved')}>Approve</button>}
                        {j.status !== 'rejected' && <button className="pill-btn-outline" onClick={() => changeJobStatus(j.id,'rejected')}>Reject</button>}
                      </div>
                    </div>
                  ))}
                </Panel>
                <Panel title="Recent Applications">
                  {summary.recentApplications.length === 0 && <p className="muted" style={{ fontSize: '.65rem' }}>No applications yet.</p>}
                  {summary.recentApplications.map(a => (
                    <div key={a.id} className="row-line">
                      <div>
                        <strong style={{ fontSize: '.7rem' }}>{a.teacher_name}</strong>
                        <div className="muted" style={{ fontSize: '.6rem' }}>{a.job_title}</div>
                      </div>
                      <div style={{ display:'flex', gap:'.25rem' }}>
                        {a.status !== 'shortlisted' && <button className="pill-btn" onClick={() => changeAppStatus(a.id,'shortlisted')}>Shortlist</button>}
                        {a.status !== 'rejected' && <button className="pill-btn-outline" onClick={() => changeAppStatus(a.id,'rejected')}>Reject</button>}
                      </div>
                    </div>
                  ))}
                </Panel>
              </div>
            </>
          )}
        </div>
      )}
      {active === 'jobs' && (
        <div style={{ display:'grid', gap:'1rem' }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'.6rem', alignItems:'center' }}>
            <select value={jobFilter} onChange={e=>setJobFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="closed">Closed</option>
            </select>
            <input style={{ flex:'1 1 200px' }} placeholder="Search jobs" value={jobSearch} onChange={e=>setJobSearch(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') loadJobs(); }} />
            <button className="btn-outline" onClick={loadJobs}>Refresh</button>
          </div>
          {loading && <p className="muted" style={{ fontSize: '.7rem' }}>Loading...</p>}
          <div className="grid" style={{ gap:'1rem', gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))' }}>
            {jobs.map(j => (
              <div key={j.id} className="card" style={{ display:'flex', flexDirection:'column', gap:'.6rem' }}>
                <div>
                  <h3 style={{ margin:0, fontSize:'.9rem' }}>{j.title}</h3>
                  <div className="muted" style={{ fontSize: '.6rem' }}>{j.status} · {j.location || '—'}</div>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'.4rem' }}>
                  {j.status !== 'approved' && <button className="pill-btn" onClick={()=>changeJobStatus(j.id,'approved')}>Approve</button>}
                  {j.status !== 'pending' && <button className="pill-btn-outline" onClick={()=>changeJobStatus(j.id,'pending')}>Pending</button>}
                  {j.status !== 'rejected' && <button className="pill-btn-outline" onClick={()=>changeJobStatus(j.id,'rejected')}>Reject</button>}
                  {j.status !== 'closed' && <button className="pill-btn-outline" onClick={()=>changeJobStatus(j.id,'closed')}>Close</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {active === 'applications' && (
        <div style={{ display:'grid', gap:'1rem' }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'.6rem', alignItems:'center' }}>
            <select value={appFilterStatus} onChange={e=>setAppFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
              <option value="hired">Hired</option>
            </select>
            <input style={{ width:140 }} placeholder="Job ID" value={appJobId} onChange={e=>setAppJobId(e.target.value)} />
            <button className="btn-outline" onClick={loadApplications}>Refresh</button>
          </div>
          {loading && <p className="muted" style={{ fontSize: '.7rem' }}>Loading...</p>}
          <div className="grid" style={{ gap:'1rem', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))' }}>
            {apps.map(a => (
              <div key={a.id} className="card" style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
                <div>
                  <strong style={{ fontSize: '.75rem' }}>{a.teacher_name}</strong>
                  <div className="muted" style={{ fontSize: '.6rem' }}>{a.job_title}</div>
                  <div className="muted" style={{ fontSize: '.55rem', marginTop: '.2rem' }}>{a.status}</div>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'.4rem' }}>
                  {a.status !== 'shortlisted' && <button className="pill-btn" onClick={()=>changeAppStatus(a.id,'shortlisted')}>Shortlist</button>}
                  {a.status !== 'rejected' && <button className="pill-btn-outline" onClick={()=>changeAppStatus(a.id,'rejected')}>Reject</button>}
                  {a.status !== 'hired' && <button className="pill-btn-outline" onClick={()=>changeAppStatus(a.id,'hired')}>Hire</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {active === 'users' && (
        <div style={{ display:'grid', gap:'1rem' }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'.6rem', alignItems:'center' }}>
            <select value={userRoleFilter} onChange={e=>setUserRoleFilter(e.target.value)}>
              <option value=''>All Roles</option>
              <option value='teacher'>Teachers</option>
              <option value='employer'>Employers</option>
              <option value='admin'>Admins</option>
            </select>
            <input style={{ flex:'1 1 200px' }} placeholder='Search users' value={userSearch} onChange={e=>setUserSearch(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') loadUsers(); }} />
            <button className='btn-outline' onClick={loadUsers}>Refresh</button>
          </div>
          {loading && <p className='muted' style={{ fontSize: '.7rem' }}>Loading...</p>}
          <div style={{ display:'grid', gap:'.5rem' }}>
            {users.filter(u => u.role !== 'admin').map(u => (
              <div key={u.id} className='row-line' style={{ alignItems:'flex-start' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:'.15rem' }}>
                  <strong style={{ fontSize:'.7rem' }}>{u.name}</strong>
                  <span className='muted' style={{ fontSize:'.55rem' }}>{u.email}</span>
                </div>
                <div style={{ fontSize:'.55rem', fontWeight:600, letterSpacing:'.6px', textTransform:'uppercase', background:'var(--color-surface)', padding:'.35rem .6rem', borderRadius:'999px', border:'1px solid var(--color-border)' }}>{u.role}</div>
              </div>
            ))}
            {users.length === 0 && !loading && <p className='muted' style={{ fontSize:'.65rem' }}>No users found.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card" style={{ padding: '.9rem .95rem' }}>
      <div style={{ fontSize: '.6rem', letterSpacing: '.5px' }} className="muted">{label.toUpperCase()}</div>
      <div style={{ fontSize: '1.15rem', fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="card" style={{ padding: '.9rem .95rem', display:'flex', flexDirection:'column', gap:'.6rem' }}>
      <div style={{ fontSize: '.7rem', fontWeight:600 }}>{title}</div>
      <div style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>{children}</div>
    </div>
  );
}
