import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../util/api.js';
import { useAuth } from '../state/AuthContext.jsx';

export default function DashboardTeacher() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState(()=>{
    const params = new URLSearchParams(location.search);
    const t = params.get('tab');
    return ['dashboard','search','applications','notifications'].includes(t) ? t : 'dashboard';
  });
  useEffect(()=>{
    const params = new URLSearchParams(location.search);
    const t = params.get('tab');
    if (t && ['dashboard','search','applications','notifications'].includes(t) && t!==tab) {
      setTab(t);
    }
  }, [location.search]);
  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [resumeExists, setResumeExists] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const [appRes, jobsRes, profRes] = await Promise.all([
          api.get('/applications/mine').catch(()=>({ applications:[] })),
          api.get('/jobs').catch(()=>({ jobs:[] })),
          api.get('/profiles/me').catch(()=>({ profile:null }))
        ]);
        if (!mounted) return;
        setApps(appRes.applications || []);
    setJobs((jobsRes.jobs||[]).slice(0,12));
    const prof = profRes.profile && user.role==='teacher' ? profRes.profile : null;
    setProfile(prof);
    if (prof?.resume_present) setResumeExists(true);
      } catch (e) { setError(e.message||'Load failed'); }
      finally { if (mounted) setLoading(false); }
    }
    load();
    return () => { mounted=false; };
  }, [user.role]);

  const stats = useMemo(()=>{
    const submitted = apps.length;
    const interviews = apps.filter(a=>a.status==='shortlisted').length; // treating shortlisted as scheduled
    const views = 8 + submitted*2; // placeholder
    return { submitted, interviews, views };
  }, [apps]);

  const profileCompletion = useMemo(()=>{
    if (!profile) return 40; // base
    const fields = ['subjects','grades','experience_years','skills','bio'];
    let filled = 0; fields.forEach(f=>{ if (profile[f]) filled++; });
    return Math.min(95, 40 + Math.round(filled/fields.length*60));
  }, [profile]);

  function StatCard({ value, label, color }) {
    return (
      <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', padding:'1rem 1.1rem', borderRadius:'14px', display:'flex', flexDirection:'column', gap:'.4rem', minWidth:180 }}>
        <div style={{ fontSize:'1.4rem', fontWeight:600, color }}>{value}</div>
        <div style={{ fontSize:'.7rem', letterSpacing:'.5px', fontWeight:600, color:'var(--color-text-dim)' }}>{label}</div>
      </div>
    );
  }

  async function handleUploadResume() {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.doc,.docx,application/pdf';
      input.onchange = async () => {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
  if (file.size > 20 * 1024 * 1024) { alert('File too large (max 20MB)'); return; }
        setUploading(true);
        const fd = new FormData();
        fd.append('resume', file);
        const token = localStorage.getItem('token');
        const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + '/profiles/teacher/resume', {
          method: 'POST',
          headers: token ? { Authorization: 'Bearer '+token } : {},
          body: fd
        });
        if (!res.ok) {
          const data = await res.json().catch(()=>({}));
          alert(data.error || 'Upload failed');
        } else {
          setResumeExists(true);
        }
  setUploading(false);
      };
      input.click();
    } catch (e) {
      console.error(e);
      alert('Upload failed');
      setUploading(false);
    }
  }

  async function handleDownloadResume() {
    try {
      setDownloading(true);
  const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + '/profiles/teacher/resume', { headers: { Authorization: 'Bearer '+localStorage.getItem('token') } });
      if (!res.ok) { alert('No resume uploaded'); setDownloading(false); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resume';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDownloading(false);
    } catch (e) {
      console.error(e);
      alert('Download failed');
      setDownloading(false);
    }
  }

  function JobCard({ job }) {
    const skills = (job.skills_required||'').split(/[,]/).map(s=>s.trim()).filter(Boolean).slice(0,4);
    const match = job._match || 0;
    return (
      <div className="emp-job-row" style={{ gap:'.65rem' }}>
        <div style={{ fontSize:'.85rem', fontWeight:600 }}>{job.title}</div>
        <div style={{ display:'flex', gap:'1.1rem', flexWrap:'wrap', fontSize:'.65rem', color:'var(--color-text-dim)' }}>
          <span>🏫 {job.institution_name || job.employer_name || 'University'}</span>
          <span>📍 {job.city || job.location || '—'}</span>
          {job.salary_min && <span>💰 ₹{job.salary_min}{job.salary_max?`-₹${job.salary_max}`:''}</span>}
        </div>
        <div style={{ fontSize:'.65rem', lineHeight:1.4, color:'var(--color-text-dim)' }}>{(job.description||'').slice(0,120)}{(job.description||'').length>120?'…':''}</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'.4rem' }}>
          {skills.map(s=> <span key={s} className="tag" style={{ fontSize:'.55rem' }}>{s}</span>)}
          {skills.length===0 && <span className="tag" style={{ fontSize:'.55rem' }}>General</span>}
          {match>0 && <span className="tag" style={{ fontSize:'.55rem', background:'var(--color-surface-alt)', border:'1px solid var(--color-border)' }}>{match} match{match>1?'es':''}</span>}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'.4rem' }}>
          <span className="tag" style={{ background:'var(--color-surface-alt)', fontSize:'.55rem' }}>{job.employment_type || 'Full-time'}</span>
          <button type="button" className="btn-outline btn-sm" onClick={()=>navigate(`/jobs/${job.id}`)}>Apply Now</button>
        </div>
      </div>
    );
  }

  function ApplicationsTab() {
    if (!apps.length) return <div className="empty-block"><div style={{fontSize:'2rem'}}>📄</div><div>No applications yet</div></div>;
    return (
      <div style={{ display:'grid', gap:'.9rem' }}>
        {apps.map(a => (
          <div key={a.id} style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', padding:'1rem 1.1rem', borderRadius:'14px', display:'grid', gap:'.4rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ fontSize:'.8rem', fontWeight:600 }}>{a.title}</div>
              <span className="badge-status" style={{ textTransform:'capitalize' }}>{a.status}</span>
            </div>
            <div style={{ fontSize:'.6rem', color:'var(--color-text-dim)' }}>Applied {new Date(a.created_at).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    );
  }

  function NotificationsTab() { return <div className="empty-block"><div style={{fontSize:'2rem'}}>🔔</div><div>No notifications</div></div>; }

  return (
    <div className="emp-layout" style={{ maxWidth:1300, margin:'0 auto', padding:'1rem 1.25rem 2.5rem' }}>
      <aside className="emp-card" style={{ position:'sticky', top:'84px' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'.9rem' }}>
          <div style={{ width:88,height:88,borderRadius:'50%',background:'rgba(255,255,255,.07)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2.3rem' }}>👩‍🏫</div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontWeight:600, fontSize:'1rem' }}>{user.name || 'Teacher'}</div>
            <div style={{ fontSize:'.7rem', color:'var(--color-text-dim)', marginTop:'.25rem' }}>Educator</div>
            <div style={{ fontSize:'.65rem', color:'var(--color-text-dim)', marginTop:'.25rem' }}>📍 {profile?.location || 'Location'}</div>
          </div>
          <div style={{ width:'100%', display:'flex', justifyContent:'space-between', fontSize:'.6rem', fontWeight:600, letterSpacing:'.6px' }}>
            <span>Profile Completion</span><span>{profileCompletion}%</span>
          </div>
          <div style={{ height:6, width:'100%', background:'var(--color-surface-alt)', borderRadius:'4px', overflow:'hidden' }}>
            <span style={{ display:'block', height:'100%', width: profileCompletion+'%', background:'linear-gradient(90deg,#2563eb,#1d4ed8)' }} />
          </div>
          <button className="btn-outline btn-sm" style={{ width:'100%' }} onClick={()=>navigate('/profile')}>Edit Profile</button>
          <button className="btn btn-sm" disabled={uploading} style={{ width:'100%' }} onClick={handleUploadResume}>{uploading? 'Uploading…':(resumeExists ? 'Update Resume':'Upload Resume')}</button>
          <button className="btn-outline btn-sm" disabled={!resumeExists || downloading} style={{ width:'100%' }} onClick={handleDownloadResume}>{downloading? 'Downloading…':'Download Resume'}</button>
        </div>
        <div style={{ fontSize:'.65rem', fontWeight:600, letterSpacing:'.7px' }}>Skills</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'.4rem' }}>
          {(profile?.skills || '').split(/[,]/).map(s=>s.trim()).filter(Boolean).slice(0,8).map(s => <span key={s} className="tag" style={{ fontSize:'.55rem' }}>{s}</span>)}
          {!profile?.skills && <span className="tag" style={{ fontSize:'.55rem' }}>Add Skills</span>}
        </div>
      </aside>
      <main className="emp-right-panel" style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
        <div className="emp-tabs">
          {['dashboard','search','applications','notifications'].map(key => (
            <button key={key} className={'emp-tab-btn '+(tab===key?'active':'')} onClick={()=>setTab(key)}>
              {key==='dashboard' && 'Dashboard'}
              {key==='search' && 'Search Jobs'}
              {key==='applications' && 'Applications'}
              {key==='notifications' && 'Notifications'}
            </button>
          ))}
        </div>
        {loading && <div className="empty-block">Loading…</div>}
        {error && <div style={{ color:'var(--color-danger)', fontSize:'.75rem' }}>{error}</div>}
        {!loading && tab==='dashboard' && (
          <>
            <div className="emp-stats-grid" style={{ marginBottom:'0' }}>
              <StatCard value={stats.submitted} label="Applications Sent" color="#2563eb" />
              <StatCard value={stats.interviews} label="Interviews Scheduled" color="#16a34a" />
              <StatCard value={stats.views} label="Profile Views" color="#d97706" />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <h3 style={{ margin:'1rem 0 .25rem', fontSize:'1rem' }}>Recommended Jobs</h3>
              <div className="emp-jobs-grid">
                {jobs.slice(0,5).map(j => <JobCard key={j.id} job={j} />)}
                {!jobs.length && <div className="empty-block"><div style={{fontSize:'2rem'}}>🔍</div><div>No jobs available</div></div>}
              </div>
            </div>
          </>
        )}
        {!loading && tab==='search' && (
          (()=>{
            const teacherSkills = (profile?.skills||'').split(/[,]/).map(s=>s.trim().toLowerCase()).filter(Boolean);
            const enriched = jobs.map(j => {
              const jobSkills = (j.skills_required||'').split(/[,]/).map(s=>s.trim().toLowerCase()).filter(Boolean);
              const match = teacherSkills.length ? teacherSkills.filter(ts=>jobSkills.includes(ts)).length : 0;
              return { ...j, _match: match };
            });
            let matched = teacherSkills.length ? enriched.filter(j=>j._match>0) : enriched;
            matched.sort((a,b)=> (b._match - a._match) || (new Date(b.created_at) - new Date(a.created_at)));
            if (!matched.length && teacherSkills.length) {
              // fallback: show recent jobs if no match
              matched = enriched.slice(0,8);
            }
            return (
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:'.75rem' }}>
                  <h3 style={{ margin:'0', fontSize:'1rem' }}>Skill Matched Jobs</h3>
                  <div style={{ fontSize:'.6rem', color:'var(--color-text-dim)' }}>
                    {teacherSkills.length ?
                      `Showing ${matched.length} job${matched.length!==1?'s':''} matched to your skills (${teacherSkills.join(', ')})`:
                      'Add skills to your profile to personalize results'}
                  </div>
                </div>
                <div className="emp-jobs-grid">
                  {matched.slice(0,12).map(j=> <JobCard key={j.id} job={j} />)}
                  {!matched.length && <div className="empty-block"><div style={{fontSize:'2rem'}}>🗂️</div><div>No jobs match your skills yet</div></div>}
                </div>
              </div>
            );
          })()
        )}
        {!loading && tab==='applications' && <ApplicationsTab />}
        {!loading && tab==='notifications' && <NotificationsTab />}
      </main>
    </div>
  );
}
