import { useEffect, useState, useMemo } from 'react';
import { api } from '../util/api.js';
import { useAuth } from '../state/AuthContext.jsx';
import { showToast } from '../util/toast.js';
import PostJob from './PostJob.jsx';

export default function DashboardEmployer() {
  const { user, setUser } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [jobs, setJobs] = useState([]);
  const [recentApps, setRecentApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const j = await api.get('/jobs?mine=1');
        const myJobs = (j.jobs || []).filter(job => job.is_owner || job.employer_id);
        let apps = [];
        try {
          const ra = await api.get('/applications/employer/recent?limit=25');
          apps = ra.applications || [];
        } catch { /* ignore */ }
        // load employer profile
        let prof = null;
        try {
          const pr = await api.get('/profiles/me');
          prof = pr.profile && user.role === 'employer' ? pr.profile : null;
        } catch { /* ignore */ }
        if (!mounted) return;        
        setJobs(myJobs);
        // sort by created_at desc
  apps.sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));
  setRecentApps(apps.slice(0,8));
        setProfile(prof);
      } catch (e) {
        setError(e.message || 'Failed to load dashboard');
      } finally { if (mounted) setLoading(false); }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const stats = useMemo(() => {
    const active = jobs.filter(j => j.status === 'approved').length;
    const totalApps = recentApps.length ? recentApps.length + Math.max(0, jobs.length*2 - recentApps.length) : jobs.length*2; // placeholder approximation
    return {
      activeJobs: active,
      totalApplications: totalApps,
      profileViews: 300 + active*12, // placeholder metric
      hiresThisMonth: Math.min(2, active)
    };
  }, [jobs, recentApps]);

  function StatCard({ label, value, color }) {
    return (
      <div className="emp-stat">
        <h4>{label}</h4>
        <div className="val" style={{ color }}>{value}</div>
      </div>
    );
  }

  function JobsTab() {
    if (!jobs.length) return <div className="empty-block"><div style={{fontSize:'2.2rem'}}>🗂️</div><div>No job postings yet</div><button className="btn" onClick={()=>setTab('post')}>Post New Job</button></div>;
    return (
      <div className="emp-jobs-grid">
        {jobs.map(j => {
          const isDraft = j.status !== 'approved';
          return (
            <div key={j.id} className="emp-job-row">
              <div className="emp-job-main">
                <div className="emp-job-title">{j.title}</div>
                <div className="emp-job-sub">{j.department || j.subject || j.organization_type || 'Discipline'}</div>
                <div className="emp-inline compact">
                  <span>📍 {j.city || j.location || '—'}</span>
                  <span>💰 {j.pay_scale || (j.salary_min ? `₹${j.salary_min}${j.salary_max?` - ₹${j.salary_max}`:''}` : '—')}</span>
                  <span>👥 {(j._appCount || 0)+Math.floor(Math.random()*4)}</span>
                  <span>👁️ {120 + (j.id%40)*3}</span>
                </div>
              </div>
              <div className="emp-job-actions">
                <div className={isDraft ? 'pill-state draft':'pill-state'}>{isDraft ? 'Draft':'Active'}</div>
                <div className="emp-job-btns">
                  <button className="icon-btn" title="Edit">✏️</button>
                  <button className="icon-btn" title="Delete">🗑️</button>
                  <button className="btn-outline btn-sm" onClick={()=>setTab('applicants')}>Applications</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function DraftsTab() {
    const drafts = jobs.filter(j => j.status !== 'approved');
    if (!drafts.length) return <div className="empty-block"><div style={{fontSize:'2.2rem'}}>📝</div><div>No drafts yet</div><button className="btn" onClick={()=>setTab('post')}>Create Draft</button></div>;
    async function publish(job){
      try {
        await api.put(`/jobs/${job.id}`, { status:'approved' });
        // optimistic update
        setJobs(prev => prev.map(j => j.id===job.id ? { ...j, status:'approved' } : j));
      } catch(e){ showToast(e.message || 'Publish failed','error'); }
    }
    return (
      <div className="emp-jobs-grid">
        {drafts.map(j => (
          <div key={j.id} className="emp-job-row draft-row">
            <div className="emp-job-main">
              <div className="emp-job-title">{j.title || 'Untitled Role'}</div>
              <div className="emp-job-sub">{j.department || j.subject || 'Department'}</div>
              <div className="emp-inline compact">
                <span>📍 {j.city || j.location || '—'}</span>
                <span>💰 {j.pay_scale || (j.salary_min ? `₹${j.salary_min}${j.salary_max?` - ₹${j.salary_max}`:''}` : '—')}</span>
              </div>
            </div>
            <div className="emp-job-actions">
              <div className="pill-state draft">Draft</div>
              <div className="emp-job-btns">
                <button className="icon-btn" title="Edit" onClick={()=>setTab('post')}>✏️</button>
                <button className="btn-outline btn-sm" onClick={()=>publish(j)}>Publish</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function updateAppStatus(id, status) {
    setRecentApps(prev => prev.map(a => a.id === id ? { ...a, _updating:true } : a));
    api.put(`/applications/${id}/status`, { status })
      .then(r => {
        setRecentApps(prev => prev.map(a => a.id === id ? { ...a, ...r.application, _updating:false } : a));
      })
      .catch(e => {
        showToast(e.message || 'Update failed','error');
        setRecentApps(prev => prev.map(a => a.id === id ? { ...a, _updating:false } : a));
      });
  }
  function ApplicantsTab() {
    if (!recentApps.length) return <div className="empty-block"><div style={{fontSize:'2.4rem'}}>👥</div><div>Applicant Management Coming Soon</div><div style={{ fontSize:'.8rem' }}>Advanced tracking & workflow features will appear here.</div><button className="btn" onClick={()=>setTab('dashboard')}>View Recent Applications</button></div>;
    return (
      <div className="emp-applicants-list">
        {recentApps.map(a => (
          <div key={a.id} className="emp-app-card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:'.25rem' }}>
                <div style={{ fontWeight:600, fontSize:'.8rem' }}>{a.teacher_name || 'Candidate Name'}</div>
                <div style={{ fontSize:'.65rem', letterSpacing:'.6px', textTransform:'uppercase', color:'var(--color-text-dim)' }}>{a.job_title}</div>
              </div>
              <div className={a.status === 'submitted' ? 'status-pill':'status-pill dim'}>{a.status === 'submitted' ? 'New':'Reviewed'}</div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'.6rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'.75rem', flexWrap:'wrap' }}>
                <div style={{ fontSize:'.6rem', color:'var(--color-text-dim)' }}>Applied {new Date(a.created_at).toLocaleDateString()}</div>
                <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap' }}>
                  <span className="tag">{a.status}</span>
                  {a._updating && <span className="tag primary">Updating…</span>}
                </div>
              </div>
              <div className="app-actions-row">
                <button className="btn-outline btn-sm" disabled={a._updating || a.status==='shortlisted'} onClick={()=>updateAppStatus(a.id,'shortlisted')}>Shortlist</button>
                <button className="btn-outline btn-sm" disabled={a._updating || a.status==='rejected'} onClick={()=>updateAppStatus(a.id,'rejected')}>Reject</button>
                <button className="btn btn-sm" disabled={a._updating || a.status==='hired'} onClick={()=>updateAppStatus(a.id,'hired')}>Hire</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const [editOpen, setEditOpen] = useState(false);
  const [orgName, setOrgName] = useState(user.name || '');
  const [orgLocation, setOrgLocation] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [description, setDescription] = useState('');

  useEffect(()=>{
    if (profile) {
      setOrgName(profile.company_name || user.name || '');
      setIndustry(profile.industry || '');
      setWebsite(profile.website || '');
      setLogoUrl(profile.logo_url || '');
      setDescription(profile.description || '');
      setOrgLocation(profile.location || '');
    }
  }, [profile, user.name]);

  function saveProfileFull(e) {
    e.preventDefault();
    const basePromise = orgName !== user.name ? api.put('/auth/me', { name: orgName }) : Promise.resolve({ user });
    basePromise
      .then(resp => { if (resp.user) setUser(prev => ({ ...prev, name: resp.user.name }));
        const payload = { company_name: orgName, industry, website, logo_url: logoUrl, description, location: orgLocation };
        return profile ? api.put('/profiles/employer', payload) : api.post('/profiles/employer', payload);
      })
      .then(r => { setProfile(r.profile); showToast('University profile saved','success'); setEditOpen(false); })
      .catch(err => showToast(err.message || 'Save failed','error'));
  }
  return (
    <div className="emp-layout">
      <aside className="emp-card">
        <div style={{ display:'flex', flexDirection:'column', gap:'.9rem' }}>
          <div style={{ width:72,height:72,borderRadius:'50%',background:'rgba(255,255,255,.06)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2rem' }}>🏛️</div>
          <div>
            <div style={{ fontWeight:600,fontSize:'1.05rem', display:'flex', alignItems:'center', gap:'.6rem' }}>
              {logoUrl && <img src={logoUrl} alt="Logo" style={{ width:34,height:34,borderRadius:'10px',objectFit:'cover',border:'1px solid var(--color-border)' }} />}
              <span>{orgName || 'University / Employer'}</span>
            </div>
            <div style={{ fontSize:'.72rem', color:'var(--color-text-dim)', marginTop:'.3rem' }}>Educational Institution</div>
            <div style={{ fontSize:'.65rem', color:'var(--color-text-dim)', marginTop:'.3rem' }}>📍 {orgLocation || 'City, Country'}</div>
          </div>
          <div style={{ fontSize:'.6rem', fontWeight:600, letterSpacing:'.75px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>University Profile</span>
            <span style={{ color:'#3b82f6' }}>90%</span>
          </div>
            <div className="emp-profile-progress"><span /></div>
            <button className="btn-outline btn-sm" onClick={()=>setEditOpen(true)}>Edit University Profile</button>
            <button className="btn btn-sm" onClick={()=>setTab('post')}>Post New Job</button>
            <div style={{ height:1, background:'var(--color-border)', margin:'4px 0 2px', opacity:.5 }} />
            <div style={{ fontSize:'.7rem', fontWeight:600, letterSpacing:'.8px', marginBottom:'.4rem' }}>University Stats</div>
            <div className="emp-small-stat"><span>Active Jobs</span><span>{stats.activeJobs}</span></div>
            <div className="emp-small-stat"><span>Total Applications</span><span>{stats.totalApplications}</span></div>
            <div className="emp-small-stat"><span>Hired This Month</span><span>{stats.hiresThisMonth}</span></div>
        </div>
      </aside>
      <main className="emp-right-panel">
        <div className="emp-tabs">
          {['dashboard','jobs','drafts','applicants','post'].map(key => (
            <button key={key} className={"emp-tab-btn "+(tab===key?'active':'')} onClick={()=>setTab(key)}>
              {key === 'dashboard' && 'Dashboard'}
              {key === 'jobs' && 'Job Postings'}
              {key === 'drafts' && 'Drafts'}
              {key === 'applicants' && 'Applicants'}
              {key === 'post' && 'Post Job'}
            </button>
          ))}
        </div>
        {loading && <div className="empty-block">Loading…</div>}
        {error && <div style={{ color:'var(--color-danger)', fontSize:'.8rem', marginBottom:'1rem' }}>{error}</div>}
        {!loading && tab === 'dashboard' && (
          <>
            <div className="emp-stats-grid">
              <StatCard label="Active Jobs" value={stats.activeJobs} color="#3b82f6" />
              <StatCard label="Total Applications" value={stats.totalApplications} color="#16a34a" />
              <StatCard label="Profile Views" value={stats.profileViews} color="#d97706" />
              <StatCard label="Hired This Month" value={stats.hiresThisMonth} color="#6366f1" />
            </div>
            <h3 style={{ margin:'0 0 1rem', fontSize:'1.05rem' }}>Recent Applicants</h3>
            <ApplicantsTab />
          </>
        )}
  {!loading && tab === 'jobs' && <JobsTab />}
  {!loading && tab === 'drafts' && <DraftsTab />}
        {!loading && tab === 'applicants' && <ApplicantsTab />}
        {!loading && tab === 'post' && <div style={{ maxWidth:760 }}><PostJob /></div>}
      </main>
      {editOpen && (
        <div className="auth-overlay" style={{ zIndex:400 }} onMouseDown={()=>setEditOpen(false)}>
          <div className="auth-dialog" style={{ maxWidth:560 }} onMouseDown={e=>e.stopPropagation()}>
            <button className="auth-close" onClick={()=>setEditOpen(false)}>✕</button>
            <div className="auth-header"><h2>Edit University Profile</h2></div>
            <div className="auth-body">
              <form onSubmit={saveProfileFull} style={{ display:'grid', gap:'1.1rem' }}>
                <div style={{ display:'grid', gap:'1rem', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))' }}>
                  <div>
                    <label>University / Employer Name</label>
                    <input value={orgName} onChange={e=>setOrgName(e.target.value)} placeholder="Institution name" required />
                  </div>
                  <div>
                    <label>Industry</label>
                    <input value={industry} onChange={e=>setIndustry(e.target.value)} placeholder="Education" />
                  </div>
                  <div>
                    <label>Website</label>
                    <input value={website} onChange={e=>setWebsite(e.target.value)} placeholder="https://..." />
                  </div>
                  <div>
                    <label>Location</label>
                    <input value={orgLocation} onChange={e=>setOrgLocation(e.target.value)} placeholder="City, Country" />
                  </div>
                </div>
                <div style={{ display:'grid', gap:'1rem', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))' }}>
                  <div>
                    <label>Logo URL</label>
                    <input value={logoUrl} onChange={e=>setLogoUrl(e.target.value)} placeholder="https://..." />
                  </div>
                  <div>
                    <label>Description</label>
                    <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Programs, mission, culture" style={{ minHeight:112 }} />
                  </div>
                </div>
                <button className="btn">Save Changes</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
