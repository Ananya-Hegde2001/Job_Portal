import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../util/api.js';
import { useAuth } from '../state/AuthContext.jsx';
import Modal from '../components/ui/Modal.jsx';

export default function DashboardTeacher() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const validTabs = ['dashboard','search','saved','applications','notifications','reviews'];
  const [tab, setTab] = useState(()=>{
    const params = new URLSearchParams(location.search);
    const t = params.get('tab');
    return validTabs.includes(t) ? t : 'dashboard';
  });
  useEffect(()=>{
    const params = new URLSearchParams(location.search);
    const t = params.get('tab');
    if (t && validTabs.includes(t) && t!==tab) setTab(t);
  }, [location.search]);
  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [alertForm, setAlertForm] = useState({ subject:'', location:'' });
  const [alertSubmitting, setAlertSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [resumeExists, setResumeExists] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState({ key:'', name:'' });
  const [reviewForm, setReviewForm] = useState({ rating: 5, message: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ id: null, name: '' });
  const [deleting, setDeleting] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertDeleteOpen, setAlertDeleteOpen] = useState(false);
  const [alertDeleteTarget, setAlertDeleteTarget] = useState(null); // {id, subject, location}
  const [alertDeleting, setAlertDeleting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  // Timeline & messaging
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineApp, setTimelineApp] = useState(null); // selected application object
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [timelineMessages, setTimelineMessages] = useState([]);
  const [messageBody, setMessageBody] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const [appRes, jobsRes, profRes, notifRes, savedRes, alertsRes] = await Promise.all([
          api.get('/applications/mine').catch(()=>({ applications:[] })),
          api.get('/jobs').catch(()=>({ jobs:[] })),
          api.get('/profiles/me').catch(()=>({ profile:null })),
          api.get('/notifications').catch(()=>({ notifications:[] })),
          api.listSavedJobs().catch(()=>({ jobs:[] })),
          api.listAlerts().catch(()=>({ alerts:[] }))
        ]);
        if (!mounted) return;
        setApps(appRes.applications || []);
  const sj = savedRes.jobs || [];
  setJobs((jobsRes.jobs||[]).slice(0,12).map(j=> ({ ...j, is_saved: sj.some(s=>s.id===j.id) })));
  setSavedJobs(sj);
  setAlerts(alertsRes.alerts||[]);
    const prof = profRes.profile && user.role==='teacher' ? profRes.profile : null;
    setProfile(prof);
    if (prof?.resume_present) setResumeExists(true);
    if (prof?.avatar_present) {
      api.getBlob('/profiles/teacher/avatar').then(blob => {
        if (!mounted) return; setAvatarUrl(URL.createObjectURL(blob));
      }).catch(()=>{});
    }
    setNotifications(notifRes.notifications || []);
      } catch (e) { setError(e.message||'Load failed'); }
      finally { if (mounted) setLoading(false); }
    }
    load();
    // Load my reviews too
    api.get('/institutions/mine/list').then(r=> setMyReviews(r.reviews||[])).catch(()=>setMyReviews([]));
    return () => { mounted=false; };
  }, [user.role]);

  const stats = useMemo(()=>{
    const submitted = apps.length;
    const interviews = apps.filter(a=>a.status==='shortlisted').length; // treating shortlisted as scheduled
    const views = 8 + submitted*2; // placeholder
    return { submitted, interviews, views };
  }, [apps]);

  // Timeline functions
  function openTimeline(app, focusMessage){
    setTimelineApp(app);
    setTimelineOpen(true);
    setMessageBody(focusMessage ? '' : '');
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
    } catch(e) {
      console.warn('Timeline load failed', e);
    } finally { setTimelineLoading(false); }
  }
  async function handleSendMessage(e){
    if (e && e.preventDefault) e.preventDefault();
    if (!timelineApp || !messageBody.trim() || sendingMessage) return;
    setSendingMessage(true);
    try {
      const res = await api.postApplicationMessage(timelineApp.id, messageBody.trim());
      // optimistic append
      setTimelineMessages(prev => [...prev, res.message]);
      setMessageBody('');
      setLastLoadedAt(Date.now());
    } catch(err){
      alert(err.message || 'Send failed');
    } finally { setSendingMessage(false); }
  }

  const profileCompletion = useMemo(()=>{
    if (!profile) return 40; // base
    const fields = ['subjects','grades','experience_years','bio'];
    let filled = 0; fields.forEach(f=>{ if (profile[f]) filled++; });
    if (Array.isArray(profile.top_skills) && profile.top_skills.length > 0) filled++;
    const total = fields.length + 1; // include top_skills as a field
    return Math.min(95, 40 + Math.round((filled/total)*60));
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

  function JobCard({ job, onSavedChange }) {
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(!!job.is_saved);
    useEffect(()=>{ setIsSaved(!!job.is_saved); }, [job.is_saved]);
    const skills = (job.skills_required||'').split(/[,]/).map(s=>s.trim()).filter(Boolean).slice(0,4);
    const match = job._match || 0;

    async function toggleLocalSave(e){
      e?.preventDefault?.();
      e?.stopPropagation?.();
      if (!user || user.role !== 'teacher' || saving) return;
      setSaving(true);
      try {
        const res = await api.toggleSaveJob(job.id);
        const saved = res.saved === true;
        setIsSaved(saved);
        if (onSavedChange) onSavedChange(job.id, saved);
      } catch(err){ console.warn(err); }
      finally { setSaving(false); }
    }

    return (
      <div className="emp-job-row" style={{ gap:'.65rem', position:'relative' }}>
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
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'.4rem', gap:'.5rem' }}>
          <span className="tag" style={{ background:'var(--color-surface-alt)', fontSize:'.55rem' }}>{job.employment_type || 'Full-time'}</span>
          <div style={{ display:'flex', alignItems:'center', gap:'.4rem' }}>
            {user?.role==='teacher' && (
              <button onClick={toggleLocalSave} disabled={saving} className={`save-toggle ${isSaved? 'saved':''}`} aria-label={isSaved? 'Unsave job':'Save job'}>
                {isSaved? '★ Saved':'☆ Save'}
              </button>
            )}
            <button type="button" className="btn-outline btn-sm" onClick={()=>navigate(`/jobs/${job.id}`)}>Apply Now</button>
          </div>
        </div>
      </div>
    );
  }

  function ApplicationsTab() {
    if (!apps.length) return <div className="empty-block"><div style={{fontSize:'2rem'}}>📄</div><div>No applications yet</div></div>;
    return (
      <div style={{ display:'grid', gap:'.9rem' }}>
        {apps.map(a => (
          <div key={a.id} style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', padding:'1rem 1.1rem', borderRadius:'14px', display:'grid', gap:'.6rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ fontSize:'.8rem', fontWeight:600 }}>{a.title}</div>
              <span className="badge-status" style={{ textTransform:'capitalize' }}>{a.status}</span>
            </div>
            <div style={{ fontSize:'.6rem', color:'var(--color-text-dim)' }}>Applied {new Date(a.created_at).toLocaleDateString()}</div>
            <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
              <button type="button" className="btn-outline btn-xs" onClick={()=>openTimeline(a)}>View Timeline</button>
              <button type="button" className="btn-outline btn-xs" onClick={()=>openTimeline(a, true)}>Message</button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  async function markNotificationRead(id) {
    try {
      await api.post(`/notifications/${id}/read`, {});
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch {}
  }

  function NotificationsTab() {
    const derived = apps.map(a => ({
      id: `app-${a.id}`,
      created_at: a.created_at,
      type: a.status === 'submitted' ? 'application_submitted' : 'application_update',
      message: `Application ${a.status === 'submitted' ? 'submitted' : 'status: '+a.status} for ${a.title}`,
      status: a.status,
      isDerived: true
    }));
    const combined = [
      ...notifications.map(n => ({ ...n, isDerived: false })),
      ...derived
    ].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

    if (!combined.length) return <div className="empty-block"><div style={{fontSize:'2rem'}}>🔔</div><div>No notifications</div></div>;
    return (
      <div style={{ display:'grid', gap:'.9rem' }}>
        {combined.map(n => (
          <div key={n.id} style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', padding:'1rem 1.1rem', borderRadius:'14px', display:'grid', gap:'.4rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ fontSize:'.8rem', fontWeight:600 }}>
                {n.type?.includes('status') || n.type==='application_update' ? 'Application Update' : 'Application Submitted'}
              </div>
              {!n.isDerived && n.is_read === 0 && (
                <button className="btn-outline btn-xs" onClick={()=>markNotificationRead(n.id)}>Mark as read</button>
              )}
            </div>
            <div style={{ fontSize:'.75rem' }}>{n.message}</div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:'.6rem', color:'var(--color-text-dim)' }}>{new Date(n.created_at).toLocaleString()}</div>
              {n.status && (
                <span className="badge-status" style={{ textTransform:'capitalize' }}>{n.status}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Open review modal based on query params
  useEffect(()=>{
    const params = new URLSearchParams(location.search);
    const key = params.get('review_for');
    const name = params.get('name');
    if (key && name) {
      setReviewTarget({ key, name });
      setReviewOpen(true);
      if (tab !== 'reviews') setTab('reviews');
    }
  }, [location.search]);

  async function submitReview(){
    try{
      setSubmittingReview(true);
      const payload = { institution_name: reviewTarget.name, rating: reviewForm.rating, message: reviewForm.message };
      let res;
      if (editingId) {
        res = await api.put(`/institutions/reviews/${editingId}`, { rating: reviewForm.rating, message: reviewForm.message });
        setMyReviews(prev => prev.map(r => r.id===editingId ? res.review : r));
      } else {
        res = await api.post(`/institutions/${encodeURIComponent(reviewTarget.key)}/reviews`, payload);
        setMyReviews(prev => [res.review, ...prev]);
      }
      setReviewOpen(false);
      const sp = new URLSearchParams(location.search);
      sp.delete('review_for'); sp.delete('name');
      navigate({ pathname: location.pathname, search: sp.toString() }, { replace: true });
      setReviewForm({ rating: 5, message: '' });
      setEditingId(null);
    }catch(e){
      alert(e.message||'Failed to submit review');
    }finally{
      setSubmittingReview(false);
    }
  }

  function startEditReview(r){
    setReviewTarget({ key: r.institution_key, name: r.institution_name });
    setReviewForm({ rating: r.rating, message: r.message || '' });
    setEditingId(r.id);
    setReviewOpen(true);
  }

  function openDeleteReview(r){
    setDeleteTarget({ id: r.id, name: r.institution_name });
    setDeleteOpen(true);
  }

  async function confirmDelete(){
    if (!deleteTarget.id) return;
    try{
      setDeleting(true);
      await api.delete(`/institutions/reviews/${deleteTarget.id}`);
      setMyReviews(prev => prev.filter(r => r.id !== deleteTarget.id));
      setDeleteOpen(false);
      setDeleteTarget({ id: null, name: '' });
    }catch(e){
      alert(e.message||'Failed to delete');
    }finally{
      setDeleting(false);
    }
  }

  // Saved jobs & alerts logic
  function toggleSave(jobId, saved){
    setJobs(prev => prev.map(j => j.id===jobId ? { ...j, is_saved: saved } : j));
    setSavedJobs(prev => {
      if (saved) {
        const job = jobs.find(j=>j.id===jobId);
        if (!job) return prev;
        if (prev.some(j=>j.id===jobId)) return prev;
        return [job, ...prev];
      } else {
        return prev.filter(j=>j.id!==jobId);
      }
    });
  }

  async function submitAlert(e){
    if (e?.preventDefault) e.preventDefault();
    if (alertSubmitting) return;
    if (!alertForm.subject && !alertForm.location) { alert('Provide a subject or location'); return; }
    setAlertSubmitting(true);
    try {
      const res = await api.createAlert(alertForm.subject.trim()||null, alertForm.location.trim()||null);
      setAlerts(a=>[res.alert, ...a]);
      setAlertForm({ subject:'', location:'' });
      setAlertModalOpen(false);
    } catch(e){ alert(e.message||'Failed to create alert'); }
    finally { setAlertSubmitting(false); }
  }

  function openDeleteAlert(alertObj){
    setAlertDeleteTarget(alertObj);
    setAlertDeleteOpen(true);
  }

  async function confirmDeleteAlert(){
    if (!alertDeleteTarget?.id) return;
    try {
      setAlertDeleting(true);
      await api.deleteAlert(alertDeleteTarget.id);
      setAlerts(a=>a.filter(x=>x.id!==alertDeleteTarget.id));
      setAlertDeleteOpen(false);
      setAlertDeleteTarget(null);
    } catch(e){
      alert(e.message||'Delete failed');
    } finally { setAlertDeleting(false); }
  }

  async function handleUnsave(jobId){
    try {
      const res = await api.toggleSaveJob(jobId);
      if (res.saved === false) toggleSave(jobId, false);
    } catch(e){ alert(e.message||'Failed to unsave'); }
  }

  function SavedTab(){
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
        <div>
          <h3 style={{ margin:'0 0 .5rem', fontSize:'1rem' }}>Saved Jobs</h3>
          {savedJobs.length===0 ? (
            <div className="empty-block"><div style={{ fontSize:'2rem' }}>⭐</div><div>No saved jobs yet. Click ☆ Save on jobs to bookmark them.</div></div>
          ) : (
            <div className="emp-jobs-grid">
              {savedJobs.map(j=> (
                <div key={j.id} className="emp-job-row" style={{ gap:'.65rem' }}>
                  <div style={{ fontSize:'.85rem', fontWeight:600 }}>{j.title}</div>
                  <div style={{ fontSize:'.6rem', color:'var(--color-text-dim)' }}>{j.institution_name || j.employer_name}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'.5rem' }}>
                    <button className="btn-outline btn-xs" onClick={()=>navigate(`/jobs/${j.id}`)}>View</button>
                    <button className="btn-outline btn-xs" onClick={()=>handleUnsave(j.id)}>Unsave</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 style={{ margin:'1rem 0 .5rem', fontSize:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>Job Alerts</span>
            <button type="button" className="btn btn-sm" onClick={()=>setAlertModalOpen(true)}>Add Alert</button>
          </h3>
          {alerts.length===0 ? (
            <div className="empty-block"><div style={{ fontSize:'2rem' }}>🔔</div><div>No alerts yet. Create one to get notified.</div></div>
          ) : (
            <div style={{ display:'grid', gap:'.7rem' }}>
              {alerts.map(a => (
                <div key={a.id} style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', padding:'.8rem .9rem', borderRadius:'12px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'.75rem', flexWrap:'wrap' }}>
                  <div style={{ fontSize:'.7rem', display:'flex', flexDirection:'column', gap:'.25rem' }}>
                    <span><strong>Subject:</strong> {a.subject || '—'}</span>
                    <span><strong>Location:</strong> {a.location || '—'}</span>
                  </div>
                  <button className="btn-outline btn-xs" onClick={()=>openDeleteAlert(a)}>Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
  <div className="emp-layout" style={{ maxWidth:1300, margin:'1.25rem auto 0', padding:'1rem 1.25rem 2.5rem' }}>
      <aside className="emp-card" style={{ position:'sticky', top:'84px' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'.9rem' }}>
          <div
            onClick={()=>navigate('/profile')}
            title="Edit profile photo"
            style={{ width:88,height:88,borderRadius:'50%',background: avatarUrl? 'var(--color-surface-alt)':'rgba(255,255,255,.07)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2.3rem',overflow:'hidden',cursor:'pointer',border:'2px solid var(--color-border)' }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" style={{ width:'100%',height:'100%',objectFit:'cover' }} />
            ) : (
              <span style={{ fontSize:'2.1rem' }}>👩‍🏫</span>
            )}
          </div>
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
          {/* Tiered blue action buttons for visual hierarchy */}
          <button
            className="btn btn-sm"
            style={{ width:'100%', background:'#2057e0', borderColor:'#2057e0', '--btn-bg':'#2057e0', '--btn-bg-hover':'#1d4fcc', justifyContent:'center' }}
            onClick={()=>navigate('/profile')}
          >Edit Profile</button>
          <button
            className="btn btn-sm"
            disabled={uploading}
            style={{ width:'100%', background:'#2f6bf0', borderColor:'#2f6bf0', '--btn-bg':'#2f6bf0', '--btn-bg-hover':'#285dd6', justifyContent:'center' }}
            onClick={handleUploadResume}
          >{uploading? 'Uploading…':(resumeExists ? 'Update Resume':'Upload Resume')}</button>
          <button
            className="btn btn-sm"
            disabled={!resumeExists || downloading}
            style={{ width:'100%', background:'#3b82f6', borderColor:'#3b82f6', '--btn-bg':'#3b82f6', '--btn-bg-hover':'#2563eb', opacity: (!resumeExists || downloading)? .7:1, justifyContent:'center' }}
            onClick={handleDownloadResume}
          >{downloading? 'Downloading…':'Download Resume'}</button>
        </div>
        <div style={{ fontSize:'.65rem', fontWeight:600, letterSpacing:'.7px' }}>Top Skills</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'.4rem' }}>
          {(profile?.top_skills || []).slice(0,8).map((s, idx) => (
            <span key={idx+String(s)} className="tag" style={{ fontSize:'.55rem' }}>{String(s).trim()}</span>
          ))}
          {(!profile?.top_skills || profile.top_skills.length===0) && <span className="tag" style={{ fontSize:'.55rem' }}>Add Skills</span>}
        </div>
      </aside>
      <main className="emp-right-panel" style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
        <div className="emp-tabs">
          {validTabs.map(key => (
            <button key={key} className={'emp-tab-btn '+(tab===key?'active':'')} onClick={()=>setTab(key)}>
              {key==='dashboard' && 'Dashboard'}
              {key==='search' && 'Search Jobs'}
              {key==='saved' && 'Saved & Alerts'}
              {key==='applications' && 'Applications'}
              {key==='notifications' && 'Notifications'}
              {key==='reviews' && "Reviews"}
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
                {jobs.slice(0,5).map(j => <JobCard key={j.id} job={j} onSavedChange={toggleSave} />)}
                {!jobs.length && <div className="empty-block"><div style={{fontSize:'2rem'}}>🔍</div><div>No jobs available</div></div>}
              </div>
            </div>
          </>
        )}
        {!loading && tab==='search' && (
          (()=>{
            const teacherSkills = (profile?.top_skills||[]).map(s=>String(s).trim().toLowerCase()).filter(Boolean);
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
                  {matched.slice(0,12).map(j=> <JobCard key={j.id} job={j} onSavedChange={toggleSave} />)}
                  {!matched.length && <div className="empty-block"><div style={{fontSize:'2rem'}}>🗂️</div><div>No jobs match your skills yet</div></div>}
                </div>
              </div>
            );
          })()
        )}
  {!loading && tab==='applications' && <ApplicationsTab />}
  {!loading && tab==='notifications' && <NotificationsTab />}
  {!loading && tab==='saved' && <SavedTab />}

        {!loading && tab==='reviews' && (
          <div style={{ marginTop:'1rem' }}>
            <h3 style={{ margin:'0 0 .5rem', fontSize:'1rem' }}>My Institution Reviews</h3>
            {myReviews.length===0 ? (
              <div className="empty-block"><div style={{fontSize:'2rem'}}>📝</div><div>No reviews yet. Click an institution to add one.</div></div>
            ) : (
              <div style={{ display:'grid', gap:'.8rem' }}>
                {myReviews.map(r=> (
                  <div key={r.id} style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', padding:'1rem 1.1rem', borderRadius:'14px', display:'grid', gap:'.3rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div style={{ fontWeight:600 }}>{r.institution_name}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:'.45rem' }}>
                        <div style={{ fontSize:'.8rem' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</div>
                        <button className="btn-outline btn-xs btn-pill" style={{ padding:'.3rem .6rem' }} onClick={()=>startEditReview(r)}>Edit</button>
                        <button className="btn-outline btn-xs btn-pill" style={{ padding:'.3rem .6rem' }} onClick={()=>openDeleteReview(r)}>Delete</button>
                      </div>
                    </div>
                    {r.message && <div style={{ fontSize:'.8rem' }}>{r.message}</div>}
                    <div style={{ fontSize:'.6rem', color:'var(--color-text-dim)' }}>{new Date(r.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Review Modal */}
      <Modal
        open={reviewOpen}
        title={`Review ${reviewTarget.name}`}
        onClose={()=>setReviewOpen(false)}
        onSubmit={submitReview}
        primaryLabel={submittingReview? 'Submitting…' : 'Submit Review'}
        secondaryLabel="Cancel"
      >
        <div style={{ display:'grid', gap:'.8rem' }}>
          <div>
            <label>Rating</label>
            <div style={{ display:'flex', gap:'.35rem' }}>
              {[1,2,3,4,5].map(n => {
                const active = reviewForm.rating >= n;
                return (
                  <button
                    key={n}
                    type="button"
                    className="btn-outline btn-xs"
                    onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                    style={{
                      borderColor: active ? '#f5b301' : undefined,
                      borderWidth: active ? 4 : 1,
                      color: active ? '#f5b301' : '#d0d0d0',
                      fontSize: '1.1rem',
                      lineHeight: 1,
                      padding: '.15rem .35rem',
                    }}
                  >
                    {n <= reviewForm.rating ? '★' : '☆'}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label>Review</label>
            <textarea rows={5} placeholder="Share your experience…" value={reviewForm.message} onChange={e=>setReviewForm(f=>({...f, message:e.target.value}))} />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteOpen}
        title="Delete Review"
        onClose={()=>setDeleteOpen(false)}
        onSubmit={confirmDelete}
        primaryLabel={deleting ? 'Deleting…' : 'Delete'}
        secondaryLabel="Cancel"
      >
        <div style={{ display:'grid', gap:'.6rem' }}>
          <div style={{ fontSize:'.9rem' }}>Are you sure you want to delete your review for <strong>{deleteTarget.name}</strong>? This action cannot be undone.</div>
        </div>
      </Modal>

      {/* Create Alert Modal */}
      <Modal
        open={alertModalOpen}
        title="Create Job Alert"
        onClose={()=>{ if(!alertSubmitting) setAlertModalOpen(false); }}
        onSubmit={submitAlert}
        primaryLabel={alertSubmitting ? 'Adding…' : 'Create Alert'}
        secondaryLabel="Cancel"
      >
        <div style={{ display:'grid', gap:'.8rem' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'.3rem' }}>
            <label style={{ fontSize:'.65rem', fontWeight:600 }}>Subject (optional)</label>
            <input value={alertForm.subject} onChange={e=>setAlertForm(f=>({...f,subject:e.target.value}))} placeholder="e.g. Mathematics" />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'.3rem' }}>
            <label style={{ fontSize:'.65rem', fontWeight:600 }}>Location (optional)</label>
            <input value={alertForm.location} onChange={e=>setAlertForm(f=>({...f,location:e.target.value}))} placeholder="e.g. Delhi" />
          </div>
          <div style={{ fontSize:'.6rem', color:'var(--color-text-dim)' }}>
            Provide at least one field. Alerts will notify you when new approved jobs match the subject and/or location.
          </div>
        </div>
      </Modal>

      {/* Delete Alert Confirmation Modal */}
      <Modal
        open={alertDeleteOpen}
        title="Delete Job Alert"
        onClose={()=>{ if(!alertDeleting) { setAlertDeleteOpen(false); setAlertDeleteTarget(null);} }}
        onSubmit={confirmDeleteAlert}
        primaryLabel={alertDeleting ? 'Deleting…' : 'Delete'}
        secondaryLabel="Cancel"
      >
        <div style={{ display:'grid', gap:'.7rem' }}>
          <div style={{ fontSize:'.85rem' }}>
            Are you sure you want to delete this alert?
          </div>
          <div style={{ fontSize:'.65rem', background:'var(--color-surface-alt)', padding:'.6rem .7rem', borderRadius:'8px', display:'flex', flexDirection:'column', gap:'.35rem' }}>
            <div><strong>Subject:</strong> {alertDeleteTarget?.subject || '—'}</div>
            <div><strong>Location:</strong> {alertDeleteTarget?.location || '—'}</div>
          </div>
          <div style={{ fontSize:'.6rem', color:'var(--color-text-dim)' }}>This cannot be undone.</div>
        </div>
      </Modal>

      {/* Timeline & Messaging Modal */}
      <Modal
        open={timelineOpen}
        title={timelineApp ? `Application Timeline – ${timelineApp.title}` : 'Application Timeline'}
        onClose={()=>{ if(!sendingMessage) { setTimelineOpen(false); setTimelineApp(null); } }}
        onSubmit={handleSendMessage}
        primaryLabel={sendingMessage ? 'Sending…' : 'Send Message'}
        secondaryLabel="Close"
        width={860}
      >
        <div style={{ display:'flex', gap:'1.1rem', maxHeight:'60vh', overflow:'hidden' }}>
          {/* Left Column – Status Events */}
          <div style={{ flex:'0 0 44%', display:'flex', flexDirection:'column', minWidth:0 }}>
            <div style={{ fontSize:'.65rem', fontWeight:700, letterSpacing:'.6px', opacity:.85, paddingBottom:'.35rem', borderBottom:'1px solid var(--color-border)' }}>STATUS EVENTS</div>
            <div style={{ flex:1, overflowY:'auto', padding:'.6rem .4rem .6rem .1rem', display:'flex', flexDirection:'column', gap:'.85rem' }}>
              {timelineLoading && <div style={{ fontSize:'.65rem', opacity:.7 }}>Loading…</div>}
              {!timelineLoading && timelineEvents.length === 0 && <div style={{ fontSize:'.65rem', opacity:.6 }}>No events yet.</div>}
              {!timelineLoading && timelineEvents.map(ev => (
                <div key={ev.id} style={{ display:'flex', gap:'.55rem', alignItems:'flex-start' }}>
                  <div style={{ fontSize:'.9rem', lineHeight:1 }}>{iconForEvent(ev.type)}</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'.18rem', fontSize:'.67rem' }}>
                    <div style={{ fontWeight:600, textTransform:'capitalize' }}>{labelForEvent(ev.type)}</div>
                    {ev.detail && <div style={{ fontSize:'.62rem', lineHeight:1.3 }}>{ev.detail}</div>}
                    <div style={{ fontSize:'.52rem', color:'var(--color-text-dim)' }}>{new Date(ev.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
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
              <textarea rows={2} placeholder="Type a message to the employer…" value={messageBody} onChange={e=>setMessageBody(e.target.value)} style={{ fontSize:'.7rem', resize:'vertical', minHeight:'56px' }} />
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

// Helpers appended after component for clarity (tree-shaken)
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
