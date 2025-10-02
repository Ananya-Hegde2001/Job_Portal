import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../util/api.js';
import { showToast } from '../util/toast.js';
import { useAuth } from '../state/AuthContext.jsx';
import Modal from '../components/ui/Modal.jsx';
import SectionCard from '../components/profile/SectionCard.jsx';
import ChipsInput from '../components/ui/ChipsInput.jsx';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [data, setData] = useState(null);
  const [form, setForm] = useState({});
  const isTeacher = user.role === 'teacher';
  const isAdmin = user.role === 'admin';
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const fileInputRef = useRef(null);
  useEffect(() => {
    api.get('/profiles/me').then(r => {
      const raw = r.profile || {};
      let normalized = raw;
      if (raw && raw.resume_url && !raw.linkedin_url) {
        normalized = { ...raw, linkedin_url: raw.resume_url };
      }
      // Default arrays for JSON sections
      if (normalized && isTeacher) {
        normalized.top_skills = normalized.top_skills || [];
        normalized.certificates = normalized.certificates || [];
        normalized.experience = normalized.experience || [];
        normalized.education = normalized.education || [];
        if (!normalized.gender) normalized.gender = '';
        if (!normalized.work_status) normalized.work_status = '';
      }
      setData(normalized);
      setForm(normalized);
    });
  }, []);
  useEffect(() => {
    // Try load avatar preview if present
    if (isTeacher) {
      api.getBlob('/profiles/teacher/avatar')
        .then(blob => setAvatarUrl(URL.createObjectURL(blob)))
        .catch(() => setAvatarUrl(null));
    }
  }, [isTeacher]);
  function onChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }
  function save() {
    const path = isTeacher ? '/profiles/teacher' : '/profiles/employer';
    const method = data ? 'put' : 'post';
    const payload = { ...form };
    if (isTeacher && payload.experience_years) {
      const n = Number(payload.experience_years);
      if (!Number.isFinite(n)) payload.experience_years = 0; else payload.experience_years = n;
    }
    // Ensure JSON fields for teacher
    if (isTeacher) {
      payload.top_skills = form.top_skills || [];
      payload.certificates = form.certificates || [];
      payload.experience = form.experience || [];
      payload.education = form.education || [];
    }
    // First update base account name if changed
  const namePromise = (name !== user.name || phone !== (user.phone||'')) ? api.put('/auth/me', { name, phone }) : Promise.resolve({ user });
    namePromise
  .then(resp => { if (resp.user) setUser(prev => ({ ...prev, name: resp.user.name, phone: resp.user.phone })); return api[method](path, payload); })
      .then(r => { setData(r.profile); showToast('Profile saved','success'); })
      .catch(e => { showToast(e.message || 'Save failed','error'); });
  }
  // Skills handled via ChipsInput inline

  const addCertificate = () => { setCertIndex(null); setCertDraft({ title:'', issuer:'', year:'', url:'' }); setOpenCert(true); };
  const removeCertificate = (i) => setForm(prev => ({ ...prev, certificates: prev.certificates.filter((_,idx)=>idx!==i) }));
  const editCertificate = (i) => { const cur = (form.certificates||[])[i]; setCertIndex(i); setCertDraft(cur || { title:'', issuer:'', year:'', url:'' }); setOpenCert(true); };

  const addExperience = () => { setExpIndex(null); setExpDraft({ title:'', organization:'', start:'', end:'', location:'', description:'' }); setOpenExp(true); };
  const removeExperience = (i) => setForm(prev => ({ ...prev, experience: prev.experience.filter((_,idx)=>idx!==i) }));
  const editExperience = (i) => { const cur = (form.experience||[])[i]; setExpIndex(i); setExpDraft(cur || { title:'', organization:'', start:'', end:'', location:'', description:'' }); setOpenExp(true); };

  const addEducation = () => { setEduIndex(null); setEduDraft({ level:'', institute:'', degree:'', start:'', end:'', grade:'' }); setOpenEdu(true); };
  const removeEducation = (i) => setForm(prev => ({ ...prev, education: prev.education.filter((_,idx)=>idx!==i) }));
  const editEducation = (i) => { const cur = (form.education||[])[i]; setEduIndex(i); setEduDraft(cur || { level:'', institute:'', degree:'', start:'', end:'', grade:'' }); setOpenEdu(true); };

  const onPickAvatar = () => fileInputRef.current?.click();
  const onAvatarFile = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('avatar', f);
    try {
      await api.upload('/profiles/teacher/avatar', fd, 'POST');
      const blob = await api.getBlob('/profiles/teacher/avatar');
      setAvatarUrl(URL.createObjectURL(blob));
      showToast('Profile picture updated', 'success');
    } catch (err) {
      showToast(err.message || 'Avatar upload failed', 'error');
    } finally {
      e.target.value = '';
    }
  };
  const removeAvatar = async () => {
    try {
      await api.del('/profiles/teacher/avatar');
      setAvatarUrl(null);
      showToast('Profile picture removed', 'success');
    } catch (e) { showToast(e.message || 'Failed to remove', 'error'); }
  };
  // Modal state & handlers

  const [openCert, setOpenCert] = useState(false);
  const [certDraft, setCertDraft] = useState({ title:'', issuer:'', year:'', url:'' });
  const [certIndex, setCertIndex] = useState(null);
  const saveCert = () => {
    const t = String(certDraft.title || '').trim();
    if (!t) { showToast('Title is required','error'); return; }
    setForm(prev => {
      const arr = [...(prev.certificates||[])];
      const normalized = { title: t, issuer: (certDraft.issuer||'').trim(), year: String(certDraft.year||'').trim(), url: String(certDraft.url||'').trim() };
      if (certIndex == null) arr.push(normalized); else arr[certIndex] = normalized;
      return { ...prev, certificates: arr };
    });
    setOpenCert(false);
  };

  const [openExp, setOpenExp] = useState(false);
  const [expDraft, setExpDraft] = useState({ title:'', organization:'', start:'', end:'', location:'', description:'' });
  const [expIndex, setExpIndex] = useState(null);
  const saveExp = () => {
    const t = String(expDraft.title || '').trim();
    if (!t) { showToast('Role/Title is required','error'); return; }
    setForm(prev => {
      const arr = [...(prev.experience||[])];
      const normalized = { ...expDraft, title: t, organization: (expDraft.organization||'').trim(), start: String(expDraft.start||'').trim(), end: String(expDraft.end||'').trim(), location: String(expDraft.location||'').trim(), description: String(expDraft.description||'').trim() };
      if (expIndex == null) arr.push(normalized); else arr[expIndex] = normalized;
      return { ...prev, experience: arr };
    });
    setOpenExp(false);
  };

  const [openEdu, setOpenEdu] = useState(false);
  const [eduDraft, setEduDraft] = useState({ level:'', institute:'', degree:'', start:'', end:'', grade:'' });
  const [eduIndex, setEduIndex] = useState(null);
  const saveEdu = () => {
    const lvl = String(eduDraft.level || '').trim();
    if (!lvl) { showToast('Level is required','error'); return; }
    setForm(prev => {
      const arr = [...(prev.education||[])];
      const normalized = { level: lvl, institute: String(eduDraft.institute||'').trim(), degree: String(eduDraft.degree||'').trim(), start: String(eduDraft.start||'').trim(), end: String(eduDraft.end||'').trim(), grade: String(eduDraft.grade||'').trim() };
      if (eduIndex == null) arr.push(normalized); else arr[eduIndex] = normalized;
      return { ...prev, education: arr };
    });
    setOpenEdu(false);
  };
  return (
    <div style={{ maxWidth: 820, marginTop:'1.25rem' }}>
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
      {isTeacher && (
        <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1rem' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', overflow:'hidden', background: 'var(--surface)', border: '1px solid var(--border-subtle)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {avatarUrl ? <img alt="avatar" src={avatarUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span className="muted" style={{ fontSize: '.65rem' }}>No Photo</span>}
          </div>
          <div style={{ display:'flex', gap:'.5rem' }}>
            <button className="btn" type="button" onClick={onPickAvatar}>Upload Photo</button>
            {avatarUrl && <button className="btn btn-outline" type="button" onClick={removeAvatar}>Remove</button>}
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onAvatarFile} style={{ display:'none' }} />
          </div>
        </div>
      )}
      <div style={{ display:'grid', gap:'1rem', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', maxWidth:640, marginBottom:'1rem' }}>
        <div>
          <label style={{ fontSize: '.65rem' }}>Full Name</label>
          <input name="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" />
        </div>
        <div>
          <label style={{ fontSize: '.65rem' }}>Phone</label>
          <input name="phone" value={phone} onChange={e=>{ const v=e.target.value.replace(/[^\d]/g,'').slice(0,10); setPhone(v); }} placeholder="9876543210" />
          {phone && !/^\d{10}$/.test(phone) && (
            <div style={{ color:'var(--color-danger)', fontSize:'.55rem', marginTop:'.25rem', fontWeight:600, letterSpacing:'.5px' }}>Invalid phone</div>
          )}
        </div>
        <div>
          <label style={{ fontSize: '.65rem' }}>Email</label>
          <input value={user.email} readOnly disabled style={{ opacity:.9 }} />
        </div>
      </div>
      {isTeacher ? (
        <div className="stack">
          <SectionCard title="Professional Summary" description="Your core details used across applications.">
            <div style={{ display:'grid', gap:'1rem', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))' }}>
              <div>
                <label>Subjects</label>
                <input name="subjects" placeholder="Math, Physics" value={form.subjects||''} onChange={onChange} />
              </div>
              <div>
                <label>Grades</label>
                <input name="grades" placeholder="6-8" value={form.grades||''} onChange={onChange} />
              </div>
              <div>
                <label>Gender</label>
                <div className={`seg-toggle two ${form.gender==='female' ? 'female' : ''}`} role="radiogroup" aria-label="Gender">
                  <div className="seg-thumb" aria-hidden="true" />
                  <button type="button" role="radio" aria-checked={form.gender==='male'} className={form.gender==='male' ? 'active' : ''} onClick={()=>setForm(prev=>({ ...prev, gender:'male' }))}>Male</button>
                  <button type="button" role="radio" aria-checked={form.gender==='female'} className={form.gender==='female' ? 'active' : ''} onClick={()=>setForm(prev=>({ ...prev, gender:'female' }))}>Female</button>
                </div>
              </div>
              <div>
                <label>Experience Years</label>
                <input name="experience_years" placeholder="5" value={form.experience_years||''} onChange={onChange} />
              </div>
              <div>
                <label>Work Status</label>
                <div className={`seg-toggle two work-status ${form.work_status==='fresher' ? 'female' : ''}`} role="radiogroup" aria-label="Work Status">
                  <div className="seg-thumb" aria-hidden="true" />
                  <button type="button" role="radio" aria-checked={form.work_status==='experienced'} className={form.work_status==='experienced' ? 'active' : ''} onClick={()=>setForm(prev=>({ ...prev, work_status:'experienced' }))}>I'm experienced</button>
                  <button type="button" role="radio" aria-checked={form.work_status==='fresher'} className={form.work_status==='fresher' ? 'active' : ''} onClick={()=>setForm(prev=>({ ...prev, work_status:'fresher' }))}>I'm fresher</button>
                </div>
              </div>
              <div>
                <label>Location</label>
                <input name="location" placeholder="City / Remote" value={form.location||''} onChange={onChange} />
              </div>
              <div style={{ gridColumn:'1 / -1' }}>
                <label>LinkedIn URL</label>
                <input name="linkedin_url" placeholder="https://www.linkedin.com/in/your-profile" value={form.linkedin_url || form.resume_url || ''} onChange={onChange} />
              </div>
              <div style={{ gridColumn:'1 / -1' }}>
                <label>Bio</label>
                <textarea name="bio" placeholder="Passionate about learner-centered pedagogy" value={form.bio||''} onChange={onChange} />
              </div>
              {/* Removed legacy 'Skills (comma separated)' field; using Top Skills chips section instead */}
            </div>
          </SectionCard>

          <SectionCard title="Top Skills" description="Highlight your strongest skills to appear in searches.">
            <ChipsInput value={form.top_skills||[]} onChange={(arr)=>setForm(prev=>({ ...prev, top_skills: arr }))} />
          </SectionCard>

          <SectionCard title="Certificates" description="Showcase your certifications.">
            <ul className="list-clean">
              {(form.certificates||[]).map((c, i) => (
                <li key={i} className="list-item">
                  <div className="item-head">
                    <div className="item-title">{c.title}</div>
                    <div className="item-actions">
                      <button type="button" className="btn btn-sm btn-outline" onClick={()=>editCertificate(i)}>Edit</button>
                      <button type="button" className="btn btn-sm btn-outline" onClick={()=>removeCertificate(i)}>Remove</button>
                    </div>
                  </div>
                  <div className="item-sub">{[c.issuer, c.year].filter(Boolean).join(' • ')} {c.url ? (<>
                    • <a href={c.url} target="_blank" rel="noreferrer">link</a>
                  </>) : null}</div>
                </li>
              ))}
            </ul>
            <div><button type="button" className="btn btn-outline" onClick={addCertificate}>+ Add Certificate</button></div>
          </SectionCard>

          <SectionCard title="Experience" description="Detail your relevant roles and impact.">
            <ul className="list-clean">
              {(form.experience||[]).map((ex, i) => (
                <li key={i} className="list-item">
                  <div className="item-head">
                    <div className="item-title">{ex.title} {ex.organization ? `• ${ex.organization}` : ''}</div>
                    <div className="item-actions">
                      <button type="button" className="btn btn-sm btn-outline" onClick={()=>editExperience(i)}>Edit</button>
                      <button type="button" className="btn btn-sm btn-outline" onClick={()=>removeExperience(i)}>Remove</button>
                    </div>
                  </div>
                  <div className="item-sub">{[ex.start, ex.end].filter(Boolean).join(' - ')} {ex.location ? `• ${ex.location}` : ''}</div>
                  {ex.description && <div>{ex.description}</div>}
                </li>
              ))}
            </ul>
            <div><button type="button" className="btn btn-outline" onClick={addExperience}>+ Add Experience</button></div>
          </SectionCard>

          <SectionCard title="Education" description="Your academic background.">
            <ul className="list-clean">
              {(form.education||[]).map((ed, i) => (
                <li key={i} className="list-item">
                  <div className="item-head">
                    <div className="item-title">{ed.level} {ed.institute ? `• ${ed.institute}` : ''}</div>
                    <div className="item-actions">
                      <button type="button" className="btn btn-sm btn-outline" onClick={()=>editEducation(i)}>Edit</button>
                      <button type="button" className="btn btn-sm btn-outline" onClick={()=>removeEducation(i)}>Remove</button>
                    </div>
                  </div>
                  <div className="item-sub">{[ed.start, ed.end].filter(Boolean).join(' - ')} {ed.degree ? `• ${ed.degree}` : ''} {ed.grade ? `• ${ed.grade}` : ''}</div>
                </li>
              ))}
            </ul>
            <div><button type="button" className="btn btn-outline" onClick={addEducation}>+ Add Education</button></div>
          </SectionCard>
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

      {/* Modals */}
      <Modal open={openCert} title={certIndex==null ? 'Add Certificate' : 'Edit Certificate'} onClose={()=>setOpenCert(false)} onSubmit={saveCert}>
        <div className="grid" style={{ gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))' }}>
          <div>
            <label>Title</label>
            <input value={certDraft.title} onChange={e=>setCertDraft({ ...certDraft, title:e.target.value })} placeholder="e.g., B.Ed Certification" />
          </div>
          <div>
            <label>Issuer</label>
            <input value={certDraft.issuer} onChange={e=>setCertDraft({ ...certDraft, issuer:e.target.value })} placeholder="e.g., State Board" />
          </div>
          <div>
            <label>Year</label>
            <input value={certDraft.year} onChange={e=>setCertDraft({ ...certDraft, year:e.target.value })} placeholder="e.g., 2023" />
          </div>
          <div>
            <label>URL</label>
            <input value={certDraft.url} onChange={e=>setCertDraft({ ...certDraft, url:e.target.value })} placeholder="https://..." />
          </div>
        </div>
      </Modal>

      <Modal open={openExp} title={expIndex==null ? 'Add Experience' : 'Edit Experience'} onClose={()=>setOpenExp(false)} onSubmit={saveExp} width={680}>
        <div className="grid" style={{ gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))' }}>
          <div>
            <label>Role / Title</label>
            <input value={expDraft.title} onChange={e=>setExpDraft({ ...expDraft, title:e.target.value })} placeholder="e.g., Mathematics Teacher" />
          </div>
          <div>
            <label>Organization</label>
            <input value={expDraft.organization} onChange={e=>setExpDraft({ ...expDraft, organization:e.target.value })} placeholder="e.g., Springfield High" />
          </div>
          <div>
            <label>Start</label>
            <input value={expDraft.start} onChange={e=>setExpDraft({ ...expDraft, start:e.target.value })} placeholder="YYYY-MM" />
          </div>
          <div>
            <label>End</label>
            <input value={expDraft.end} onChange={e=>setExpDraft({ ...expDraft, end:e.target.value })} placeholder="YYYY-MM or Present" />
          </div>
          <div>
            <label>Location</label>
            <input value={expDraft.location} onChange={e=>setExpDraft({ ...expDraft, location:e.target.value })} placeholder="City / Remote" />
          </div>
          <div style={{ gridColumn:'1 / -1' }}>
            <label>Description</label>
            <textarea value={expDraft.description} onChange={e=>setExpDraft({ ...expDraft, description:e.target.value })} placeholder="Responsibilities, achievements..." />
          </div>
        </div>
      </Modal>

      <Modal open={openEdu} title={eduIndex==null ? 'Add Education' : 'Edit Education'} onClose={()=>setOpenEdu(false)} onSubmit={saveEdu} width={680}>
        <div className="grid" style={{ gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))' }}>
          <div>
            <label>Level</label>
            <input value={eduDraft.level} onChange={e=>setEduDraft({ ...eduDraft, level:e.target.value })} placeholder="College / PU / High School" />
          </div>
          <div>
            <label>Institute</label>
            <input value={eduDraft.institute} onChange={e=>setEduDraft({ ...eduDraft, institute:e.target.value })} placeholder="e.g., ABC College" />
          </div>
          <div>
            <label>Degree / Stream</label>
            <input value={eduDraft.degree} onChange={e=>setEduDraft({ ...eduDraft, degree:e.target.value })} placeholder="e.g., B.Sc" />
          </div>
          <div>
            <label>Start</label>
            <input value={eduDraft.start} onChange={e=>setEduDraft({ ...eduDraft, start:e.target.value })} placeholder="YYYY" />
          </div>
          <div>
            <label>End</label>
            <input value={eduDraft.end} onChange={e=>setEduDraft({ ...eduDraft, end:e.target.value })} placeholder="YYYY" />
          </div>
          <div>
            <label>Grade / Score</label>
            <input value={eduDraft.grade} onChange={e=>setEduDraft({ ...eduDraft, grade:e.target.value })} placeholder="e.g., 8.5 CGPA" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
