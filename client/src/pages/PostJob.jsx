import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../util/api.js';

export default function PostJob({ job, onSaved }) {
  const navigate = useNavigate();
  const location = useLocation();
  // allow passing job via location.state.editJob
  const editJob = job || location.state?.editJob || null;
  const [form, setForm] = useState({
    title:'', department:'', location:'', employment_type:'', pay_scale:'', salary_min:'', salary_max:'', subject:'', grade_level:'', description:'', skills_required:'', requirements:''
  });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const isEdit = !!editJob;

  useEffect(()=>{
    if (editJob) {
      setForm(f => ({
        ...f,
        title: editJob.title || '',
        department: editJob.department || editJob.subject || '',
        location: editJob.location || '',
        employment_type: editJob.employment_type || '',
        pay_scale: editJob.pay_scale || '',
        salary_min: editJob.salary_min || '',
        salary_max: editJob.salary_max || '',
        subject: editJob.subject || '',
        grade_level: editJob.grade_level || '',
        description: editJob.description || '',
        skills_required: editJob.skills_required || '',
        requirements: editJob.requirements || ''
      }));
    }
  }, [editJob]);
  function onChange(e){ setForm(f=>({...f,[e.target.name]: e.target.value })); }
  function submit(status){
    setMsg(null); setLoading(true);
    const payload = { ...form };
    if (status === 'publish') {
      if (!payload.title || !payload.description) {
        setMsg('Title and description are required to publish');
        setLoading(false);
        return;
      }
    }
    if (payload.salary_min === '') delete payload.salary_min;
    if (payload.salary_max === '') delete payload.salary_max;
    payload.skills_required = payload.skills_required || '';
    payload.requirements = payload.requirements || '';
    if (!isEdit) {
      payload.status = status === 'publish' ? 'publish' : 'draft';
      api.post('/jobs', payload)
        .then(r => {
          const saved = r.job;
            setMsg(status==='publish' ? 'Job published' : 'Draft saved');
            if (onSaved) {
              onSaved(saved);
            } else {
              if (status === 'publish') navigate('/dashboard/employer?tab=jobs');
              else navigate('/dashboard/employer?tab=drafts');
            }
        })
        .catch(e => setMsg(e.message || 'Error saving job'))
        .finally(()=> setLoading(false));
    } else {
      // editing: do not auto-change status unless explicitly publishing
      if (status === 'publish' && editJob.status !== 'approved') payload.status = 'publish';
      api.put(`/jobs/${editJob.id}`, payload)
        .then(r => {
          const updated = r.job;
          setMsg('Job updated');
          if (onSaved) {
            onSaved(updated);
          } else {
            navigate(`/dashboard/employer?tab=${updated.status==='approved' ? 'jobs':'drafts'}`);
          }
        })
        .catch(e => setMsg(e.message || 'Error updating job'))
        .finally(()=> setLoading(false));
    }
  }
  return (
    <div style={{ maxWidth:880, marginTop:'1.25rem' }}>
      <h2 style={{ marginBottom:'.25rem' }}>{isEdit ? 'Edit Job Posting':'Post a Teaching Opportunity'}</h2>
      <p className="muted" style={{ marginTop:0, marginBottom:'1.4rem' }}>{isEdit ? 'Update details below. Publish to make changes live.' : 'Fill in clear, candidate-friendly details. You can save as draft or publish immediately.'}</p>
      {msg && <div style={{ marginBottom:'.9rem', fontSize:'.75rem', fontWeight:600 }}>{msg}</div>}
      <div className="card" style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)' }}>
        <form onSubmit={e=>{e.preventDefault(); submit('publish');}} style={{ display:'grid', gap:'1.3rem' }}>
          <div style={{ display:'grid', gap:'1rem', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))' }}>
            <div>
              <label>Job Title</label>
              <input name="title" value={form.title} onChange={onChange} placeholder="Associate Professor of Physics" required />
            </div>
            <div>
              <label>Department</label>
              <input name="department" value={form.department} onChange={onChange} placeholder="Physics" />
            </div>
            <div>
              <label>Location</label>
              <input name="location" value={form.location} onChange={onChange} placeholder="Bengaluru / Remote" />
            </div>
            <div>
              <label>Job Type</label>
              <input name="employment_type" value={form.employment_type} onChange={onChange} placeholder="Full-time" />
            </div>
            <div>
              <label>Salary Min (₹)</label>
              <input name="salary_min" value={form.salary_min} onChange={onChange} placeholder="600000" />
            </div>
            <div>
              <label>Salary Max (₹)</label>
              <input name="salary_max" value={form.salary_max} onChange={onChange} placeholder="900000" />
            </div>
            <div>
              <label>Pay Scale</label>
              <input name="pay_scale" value={form.pay_scale} onChange={onChange} placeholder="AICTE Level 12" />
            </div>
            <div>
              <label>Subject</label>
              <input name="subject" value={form.subject} onChange={onChange} placeholder="Quantum Mechanics" />
            </div>
            <div>
              <label>Grade Level</label>
              <input name="grade_level" value={form.grade_level} onChange={onChange} placeholder="UG / PG" />
            </div>
          </div>
          <div>
            <label>Job Description</label>
            <textarea name="description" value={form.description} onChange={onChange} placeholder="Overview, responsibilities, teaching load, research expectations" style={{ minHeight:140 }} required />
          </div>
          <div style={{ display:'grid', gap:'1rem', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))' }}>
            <div>
              <label>Required Skills (comma-separated)</label>
              <input name="skills_required" value={form.skills_required} onChange={onChange} placeholder="Machine Learning, Python, Curriculum Design" />
            </div>
            <div>
              <label>Requirements (Experience etc)</label>
              <textarea name="requirements" value={form.requirements} onChange={onChange} placeholder="PhD preferred; 5+ years teaching; publications" style={{ minHeight:100 }} />
            </div>
          </div>
          <div style={{ display:'flex', gap:'.9rem', flexWrap:'wrap' }}>
            {!isEdit && (
              <button
                type="button"
                className="btn"
                disabled={loading}
                onClick={()=>submit('draft')}
                style={{
                  background:'#2f6bf0',
                  borderColor:'#2f6bf0',
                  '--btn-bg':'#2f6bf0',
                  '--btn-bg-hover':'#285dd6'
                }}
              >{loading ? 'Saving…':'Save as Draft'}</button>
            )}
            <button type="submit" className="btn" disabled={loading}>{loading ? (isEdit ? 'Updating…':'Publishing…') : (isEdit ? 'Save Changes':'Publish Job')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
