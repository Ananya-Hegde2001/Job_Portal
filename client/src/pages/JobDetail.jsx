import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../util/api.js';
import { useAuth } from '../state/AuthContext.jsx';

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [cover, setCover] = useState('');
  const [msg, setMsg] = useState(null);
  const [applying, setApplying] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { api.get(`/jobs/${id}`).then(r => setJob(r.job)); }, [id]);
  useEffect(() => {
    if (user?.role !== 'teacher') return;
    let mounted = true;
    api.get('/applications/mine').then(r => {
      if (!mounted) return;
      if (r.applications?.some(a => a.job_id === Number(id))) setAlreadyApplied(true);
    }).catch(()=>{});
    return () => { mounted = false; };
  }, [id, user?.role]);
  function apply() {
    if (alreadyApplied || applying) return;
    setApplying(true);
    api.post('/applications', { job_id: job.id, cover_letter: cover })
      .then(() => {
        setMsg('Application submitted');
        setAlreadyApplied(true);
        // navigate to teacher dashboard applications tab after brief delay
        setTimeout(()=> navigate('/dashboard/teacher?tab=applications'), 600);
      })
      .catch(e => setMsg(e.message || 'Apply failed'))
      .finally(()=> setApplying(false));
  }
  if (!job) return <div>Loading...</div>;
  const skills = job.skills_required ? job.skills_required.split(',').map(s=>s.trim()).filter(Boolean) : [];
  return (
    <div className="grid" style={{ gap: '1.5rem', maxWidth: 1000 }}>
      <div className="card" style={{ padding: '1.5rem 1.6rem' }}>
        <h2 style={{ marginTop: 0 }}>{job.title}</h2>
        <p className="muted" style={{ marginTop: '-.4rem', fontSize:'.8rem' }}>{job.institution_name || job.employer_name} {job.city && '· '+ job.city} {job.remote_allowed ? '· Remote' : ''}</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'.4rem', margin:'0 0 1rem' }}>
          {job.employment_type && <span className="badge-status">{job.employment_type}</span>}
          {job.organization_type && <span className="badge-status">{job.organization_type}</span>}
          {job.subject && <span className="badge-status approved">{job.subject}</span>}
          {job.grade_level && <span className="badge-status">Grade: {job.grade_level}</span>}
          {job.pay_scale && <span className="badge-status">{job.pay_scale}</span>}
          {!job.pay_scale && job.salary_min && <span className="badge-status">{job.salary_min.toLocaleString()} - {job.salary_max?.toLocaleString?.() || ''}</span>}
          {job.min_experience ? <span className="badge-status">Exp ≤ {job.min_experience} yrs</span>: null}
          {job.application_deadline && <span className="badge-status">Apply by {job.application_deadline}</span>}
        </div>
        <section style={{ lineHeight:1.55, whiteSpace:'pre-line' }}>{job.description}</section>
        {job.responsibilities && <section style={{ marginTop:'1.25rem' }}><h3 style={{ fontSize:'1rem', margin:'0 0 .4rem' }}>Responsibilities</h3><div style={{ whiteSpace:'pre-line', fontSize:'.8rem', lineHeight:1.5 }}>{job.responsibilities}</div></section>}
        {job.requirements && <section style={{ marginTop:'1.25rem' }}><h3 style={{ fontSize:'1rem', margin:'0 0 .4rem' }}>Requirements</h3><div style={{ whiteSpace:'pre-line', fontSize:'.8rem', lineHeight:1.5 }}>{job.requirements}</div></section>}
        {job.education_required && <section style={{ marginTop:'1.25rem' }}><h3 style={{ fontSize:'1rem', margin:'0 0 .4rem' }}>Education Required</h3><p style={{ fontSize:'.8rem' }}>{job.education_required}</p></section>}
        {skills.length>0 && <section style={{ marginTop:'1.25rem' }}><h3 style={{ fontSize:'1rem', margin:'0 0 .4rem' }}>Skills</h3><div style={{ display:'flex', flexWrap:'wrap', gap:'.4rem' }}>{skills.map(s=> <span key={s} className="badge-status" style={{ background:'var(--color-surface-alt)' }}>{s}</span>)}</div></section>}
        {job.benefits && <section style={{ marginTop:'1.25rem' }}><h3 style={{ fontSize:'1rem', margin:'0 0 .4rem' }}>Benefits</h3><div style={{ whiteSpace:'pre-line', fontSize:'.8rem' }}>{job.benefits}</div></section>}
      </div>
      {user?.role === 'teacher' && (
        <div className="card" style={{ padding: '1.25rem 1.3rem', alignSelf:'start' }}>
          <h3 style={{ marginTop: 0 }}>Apply to this role</h3>
            {alreadyApplied ? (
              <div style={{ fontSize:'.7rem', color:'var(--color-text-dim)' }}>You have already applied to this job.</div>
            ) : (
              <>
                <textarea value={cover} onChange={e => setCover(e.target.value)} placeholder="Brief cover letter highlighting relevant experience" />
                <button className="btn" disabled={applying || !cover.trim()} onClick={apply}>{applying? 'Submitting…':'Submit Application'}</button>
              </>
            )}
            {msg && <div style={{ fontSize: '.7rem', marginTop: '.5rem' }}>{msg}</div>}
        </div>
      )}
    </div>
  );
}
