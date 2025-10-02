import { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../util/api.js';
import { useAuth } from '../state/AuthContext.jsx';
import { showToast } from '../util/toast.js';
import PostJob from './PostJob.jsx';
import Modal from '../components/ui/Modal.jsx';

export default function DashboardEmployer() {
  const { user, setUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const validTabs = ['dashboard','jobs','drafts','applicants','post'];
  const [tab, setTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    const tParam = params.get('tab');
    const tState = location.state && location.state.tab;
    return validTabs.includes(tParam) ? tParam : (validTabs.includes(tState) ? tState : 'dashboard');
  });
  useEffect(()=>{
    const params = new URLSearchParams(location.search);
    const t = params.get('tab');
    if (t && validTabs.includes(t) && t !== tab) setTab(t);
  }, [location.search]);
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
  const myJobs = j.jobs || [];
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

  // Timeline handlers
  function openTimeline(app){
    setTimelineApp(app);
    setTimelineOpen(true);
    refreshTimeline(app.id);
  }
  async function refreshTimeline(appId){
    const id = appId || (timelineApp && timelineApp.id);
    if(!id) return;
    try {
      setTimelineLoading(true);
      const res = await api.getApplicationTimeline(id);
      setTimelineEvents(res.events||[]);
      setTimelineMessages(res.messages||[]);
      setLastLoadedAt(Date.now());
    } catch(e){ console.warn('Timeline load failed', e); }
    finally { setTimelineLoading(false); }
  }
  async function handleSendMessage(e){
    if (e && e.preventDefault) e.preventDefault();
    if (!timelineApp || !messageBody.trim() || sendingMessage) return;
    setSendingMessage(true);
    try {
      const res = await api.postApplicationMessage(timelineApp.id, messageBody.trim());
      setTimelineMessages(prev => [...prev, res.message]);
      setMessageBody('');
      setLastLoadedAt(Date.now());
    } catch(err){ alert(err.message || 'Send failed'); }
    finally { setSendingMessage(false); }
  }
  async function handleAddNote(){
    if (!timelineApp || !noteBody.trim() || addingNote) return;
    setAddingNote(true);
    try {
      await api.postApplicationNote(timelineApp.id, noteBody.trim());
      setNoteBody('');
      // refresh events only
      refreshTimeline(timelineApp.id);
    } catch(err){ alert(err.message || 'Add note failed'); }
    finally { setAddingNote(false); }
  }

  function StatCard({ label, value, color }) {
    return (
      <div className="emp-stat">
        <h4>{label}</h4>
        <div className="val" style={{ color }}>{value}</div>
      </div>
    );
  }

  const [editingJob, setEditingJob] = useState(null);
  // Timeline & messaging state
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelineApp, setTimelineApp] = useState(null); // selected application record
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [timelineMessages, setTimelineMessages] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [messageBody, setMessageBody] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
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
                  <button className="icon-btn" title="Edit" onClick={()=>{ setEditingJob(j); setTab('post'); }}>✏️</button>
                  <button className="icon-btn" title="Delete" onClick={()=>deleteJob(j)}>🗑️</button>
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
                <button className="icon-btn" title="Edit" onClick={()=>{ setEditingJob(j); setTab('post'); }}>✏️</button>
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
  function deleteJob(job){
    if (!window.confirm('Delete this job? This cannot be undone.')) return;
    api.delete(`/jobs/${job.id}`)
      .then(()=>{
        setJobs(prev => prev.filter(j => j.id !== job.id));
        showToast('Job deleted','success');
      })
      .catch(e => showToast(e.message || 'Delete failed','error'));
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
              <div className="app-actions-row" style={{ display:'flex', flexWrap:'wrap', gap:'.4rem' }}>
                <button className="btn-outline btn-sm" disabled={a._updating || a.status==='shortlisted'} onClick={()=>updateAppStatus(a.id,'shortlisted')}>Shortlist</button>
                <button className="btn-outline btn-sm" disabled={a._updating || a.status==='rejected'} onClick={()=>updateAppStatus(a.id,'rejected')}>Reject</button>
                <button className="btn btn-sm" disabled={a._updating || a.status==='hired'} onClick={()=>updateAppStatus(a.id,'hired')}>Hire</button>
                <button className="btn-outline btn-sm" type="button" onClick={()=>openTimeline(a)}>Timeline</button>
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
    <div className="emp-layout" style={{ marginTop:'1.25rem' }}>
      <aside className="emp-card">
        <div style={{ display:'flex', flexDirection:'column', gap:'.9rem' }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:'.75rem' }}>
            <div style={{ width:72,height:72,borderRadius:'50%',background:'rgba(255,255,255,.06)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2rem' }}>🏛️</div>
            <div>
              <div style={{ fontWeight:600,fontSize:'1.05rem', display:'flex', alignItems:'center', gap:'.6rem', justifyContent:'center' }}>
                {logoUrl && <img src={logoUrl} alt="Logo" style={{ width:34,height:34,borderRadius:'10px',objectFit:'cover',border:'1px solid var(--color-border)' }} />}
                <span>{orgName || 'University / Employer'}</span>
              </div>
              <div style={{ fontSize:'.72rem', color:'var(--color-text-dim)', marginTop:'.3rem' }}>Educational Institution</div>
              <div style={{ fontSize:'.65rem', color:'var(--color-text-dim)', marginTop:'.3rem' }}>📍 {orgLocation || 'City, Country'}</div>
            </div>
          </div>
          <div style={{ fontSize:'.6rem', fontWeight:600, letterSpacing:'.75px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>University Profile</span>
            <span style={{ color:'#3b82f6' }}>90%</span>
          </div>
            <div className="emp-profile-progress"><span /></div>
            <button
              className="btn btn-sm"
              style={{ background:'#2057e0', borderColor:'#2057e0', '--btn-bg':'#2057e0', '--btn-bg-hover':'#1d4fcc', justifyContent:'center', width:'100%' }}
              onClick={()=>setEditOpen(true)}
            >Edit University Profile</button>
            <button
              className="btn btn-sm"
              style={{ background:'#2f6bf0', borderColor:'#2f6bf0', '--btn-bg':'#2f6bf0', '--btn-bg-hover':'#285dd6', justifyContent:'center', width:'100%' }}
              onClick={()=>setTab('post')}
            >Post New Job</button>
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
            <button key={key} className={"emp-tab-btn "+(tab===key?'active':'')} onClick={()=>{
              setTab(key);
              const params = new URLSearchParams(location.search);
              params.set('tab', key);
              navigate(`/dashboard/employer?${params.toString()}`, { replace:true });
            }}>
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
        {!loading && tab === 'post' && <div style={{ maxWidth:760 }}><PostJob job={editingJob} onSaved={async (saved)=>{
          try {
            const j = await api.get('/jobs?mine=1');
            setJobs(j.jobs || []);
          } catch {
            setJobs(prev => {
              const exists = prev.find(j => j.id === saved.id);
              if (exists) return prev.map(j => j.id === saved.id ? saved : j);
              return [saved, ...prev];
            });
          }
          setEditingJob(null);
          setTab(saved.status === 'approved' ? 'jobs':'drafts');
          const params = new URLSearchParams(location.search);
          params.set('tab', saved.status === 'approved' ? 'jobs' : 'drafts');
          navigate(`/dashboard/employer?${params.toString()}`, { replace:true });
        }} /></div>}
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
      {/* Timeline Modal */}
      <Modal
        open={timelineOpen}
        title={timelineApp ? `Application Timeline – ${timelineApp.teacher_name || 'Candidate'}` : 'Application Timeline'}
        onClose={()=>{ if(!sendingMessage && !addingNote){ setTimelineOpen(false); setTimelineApp(null);} }}
        onSubmit={handleSendMessage}
        primaryLabel={sendingMessage ? 'Sending…' : 'Send Message'}
        secondaryLabel="Close"
        width={860}
      >
        <div style={{ display:'flex', gap:'1.1rem', maxHeight:'60vh', overflow:'hidden' }}>
          {/* Left Column – Events & Notes */}
          <div style={{ flex:'0 0 44%', display:'flex', flexDirection:'column', minWidth:0 }}>
            <div style={{ fontSize:'.65rem', fontWeight:700, letterSpacing:'.6px', opacity:.85, paddingBottom:'.35rem', borderBottom:'1px solid var(--color-border)' }}>STATUS EVENTS / NOTES</div>
            <div style={{ flex:1, overflowY:'auto', padding:'.6rem .4rem .6rem .1rem', display:'flex', flexDirection:'column', gap:'.85rem' }}>
              {timelineLoading && <div style={{ fontSize:'.65rem', opacity:.7 }}>Loading…</div>}
              {!timelineLoading && timelineEvents.length === 0 && <div style={{ fontSize:'.65rem', opacity:.6 }}>No events yet.</div>}
              {!timelineLoading && timelineEvents.map(ev => (
                <div key={ev.id} style={{ display:'flex', gap:'.55rem', alignItems:'flex-start' }}>
                  <div style={{ fontSize:'.9rem', lineHeight:1 }}>{iconForEvent(ev.type)}</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'.18rem', fontSize:'.67rem' }}>
                    <div style={{ fontWeight:600 }}>{labelForEvent(ev.type)}</div>
                    {ev.detail && <div style={{ fontSize:'.62rem', lineHeight:1.3 }}>{ev.detail}</div>}
                    <div style={{ fontSize:'.52rem', color:'var(--color-text-dim)' }}>{new Date(ev.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Private Note Composer */}
            <div style={{ marginTop:'.55rem', display:'flex', flexDirection:'column', gap:'.45rem' }}>
              <textarea rows={2} placeholder="Private note (not visible to candidate)" value={noteBody} onChange={e=>setNoteBody(e.target.value)} style={{ fontSize:'.65rem', resize:'vertical', minHeight:'54px' }} />
              <button type="button" className="btn-outline btn-xs" disabled={addingNote || !noteBody.trim()} onClick={handleAddNote} style={{ alignSelf:'flex-end' }}>{addingNote ? 'Adding…':'Add Note'}</button>
            </div>
          </div>
          {/* Right Column – Messages & Composer */}
            <div style={{ flex:'1 1 auto', display:'flex', flexDirection:'column', minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'.5rem', paddingBottom:'.35rem', borderBottom:'1px solid var(--color-border)' }}>
                <div style={{ fontSize:'.65rem', fontWeight:700, letterSpacing:'.6px', opacity:.85 }}>MESSAGES</div>
                <button type="button" className="btn-outline btn-xs" style={{ fontSize:'.55rem' }} disabled={timelineLoading} onClick={()=>refreshTimeline()}>
                  {timelineLoading ? '…' : 'Refresh'}
                </button>
              </div>
              <div style={{ flex:1, overflowY:'auto', padding:'.7rem .45rem .7rem 0', display:'flex', flexDirection:'column', gap:'.75rem' }}>
                {!timelineLoading && timelineMessages.length === 0 && <div style={{ fontSize:'.65rem', opacity:.6 }}>No messages yet. Start the conversation below.</div>}
                {timelineMessages.map(m => (
                  <div key={m.id} style={{ display:'flex', flexDirection:'column', gap:'.3rem', alignItems: m.sender_user_id === user.id ? 'flex-end':'flex-start' }}>
                    <div style={{ maxWidth:'86%', background: m.sender_user_id === user.id ? 'linear-gradient(90deg,#2563eb,#1d4ed8)' : 'var(--color-surface-alt)', color: m.sender_user_id === user.id ? '#fff':'var(--color-text)', padding:'.55rem .7rem', borderRadius: m.sender_user_id === user.id ? '16px 16px 4px 16px' : '16px 16px 16px 4px', fontSize:'.7rem', lineHeight:1.35, boxShadow:'0 1px 2px rgba(0,0,0,.15)' }}>
                      {m.body}
                    </div>
                    <div style={{ fontSize:'.5rem', color:'var(--color-text-dim)' }}>{new Date(m.created_at).toLocaleTimeString()}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:'.35rem', display:'flex', flexDirection:'column', gap:'.5rem' }}>
                <textarea rows={2} placeholder="Type a message to candidate…" value={messageBody} onChange={e=>setMessageBody(e.target.value)} style={{ fontSize:'.7rem', resize:'vertical', minHeight:'56px' }} />
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:'.52rem', color:'var(--color-text-dim)' }}>{lastLoadedAt && <span>Updated {new Date(lastLoadedAt).toLocaleTimeString()}</span>}</div>
                  <button type="button" className="btn btn-xs" disabled={sendingMessage || !messageBody.trim()} onClick={handleSendMessage}>{sendingMessage ? 'Sending…':'Send'}</button>
                </div>
              </div>
            </div>
        </div>
      </Modal>
    </div>
  );
}

// Timeline helpers & handlers
function labelForEvent(type){
  switch(type){
    case 'status': return 'Status Update';
    case 'note': return 'Employer Note';
    default: return type || 'Event';
  }
}
function iconForEvent(type){
  switch(type){
    case 'status': return '⚙️';
    case 'note': return '🗒️';
    default: return '📌';
  }
}
