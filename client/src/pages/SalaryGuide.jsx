import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export const ROLES = [
  // Subject-oriented (School)
  { title: 'Mathematics Teacher (PGT)', level: 'School', avg: 650000 },
  { title: 'Physics Teacher (PGT)', level: 'School', avg: 680000 },
  { title: 'Chemistry Teacher (PGT)', level: 'School', avg: 670000 },
  { title: 'Biology Teacher (PGT)', level: 'School', avg: 640000 },
  { title: 'Computer Science Teacher (PGT)', level: 'School', avg: 700000 },
  { title: 'English Teacher (TGT)', level: 'School', avg: 500000 },
  { title: 'Hindi Teacher (TGT)', level: 'School', avg: 480000 },
  { title: 'Social Science Teacher (TGT)', level: 'School', avg: 500000 },
  { title: 'Economics Teacher (PGT)', level: 'School', avg: 680000 },
  { title: 'Accountancy Teacher (PGT)', level: 'School', avg: 690000 },
  { title: 'History Teacher (PGT)', level: 'School', avg: 610000 },
  { title: 'Geography Teacher (PGT)', level: 'School', avg: 610000 },
  { title: 'Primary School Teacher (PRT)', level: 'School', avg: 360000 },
  { title: 'Physical Education Instructor', level: 'School', avg: 420000 },

  // Subject-oriented (UG/PG)
  { title: 'Lecturer in Physics (UG)', level: 'UG', avg: 720000 },
  { title: 'Lecturer in Chemistry (UG)', level: 'UG', avg: 700000 },
  { title: 'Lecturer in Mathematics (UG)', level: 'UG', avg: 700000 },
  { title: 'Assistant Professor in Computer Science', level: 'UG', avg: 900000 },
  { title: 'Assistant Professor in English', level: 'UG', avg: 850000 },
  { title: 'Assistant Professor in Economics', level: 'UG', avg: 920000 },

  // Function-specific and research/admin
  { title: 'Instructional Designer', level: 'UG', avg: 700000 },
  { title: 'Curriculum Developer', level: 'UG', avg: 650000 },
  { title: 'Librarian', level: 'UG', avg: 400000 },
  { title: 'Academic Counselor', level: 'UG', avg: 420000 },
  { title: 'Placement Officer', level: 'UG', avg: 520000 },
  { title: 'Research Assistant', level: 'Research', avg: 360000 },
  { title: 'Junior Research Fellow (JRF)', level: 'Research', avg: 420000 },
  { title: 'Senior Research Fellow (SRF)', level: 'Research', avg: 540000 },
  { title: 'Postdoctoral Fellow', level: 'Research', avg: 900000 },
  { title: 'Associate Professor', level: 'PG', avg: 1200000 },
  { title: 'Professor', level: 'PG', avg: 1600000 },
  { title: 'Head of Department (HOD)', level: 'Admin', avg: 1800000 },
  { title: 'Dean (Academics)', level: 'Admin', avg: 2500000 },
  { title: 'Principal', level: 'Admin', avg: 1800000 },
  { title: 'Registrar', level: 'Admin', avg: 1500000 },
  { title: 'Vice Chancellor', level: 'Admin', avg: 3000000 },
  { title: 'Education Consultant', level: 'PG', avg: 1100000 },
];

export const LEVELS = ['All Levels','School','UG','PG','Research','Admin'];

export default function SalaryGuide(){
  const { t } = useTranslation();
  const [what, setWhat] = React.useState('');
  const [where, setWhere] = React.useState('India');
  const [level, setLevel] = React.useState('All Levels');
  const nav = useNavigate();
  function openDetail(role){
    nav(`/salary/${encodeURIComponent(role.title.toLowerCase().replace(/\s+/g,'-'))}`, { state: { title: role.title, avg: role.avg, where } });
  }

  const filtered = React.useMemo(()=>{
    const q = what.trim().toLowerCase();
    return ROLES.filter(r => (
      (level==='All Levels' || r.level===level) &&
      (!q || r.title.toLowerCase().includes(q))
    ));
  }, [what, level]);

  function onSearch(e){
    e?.preventDefault?.();
    const q = what.trim();
    if (q) nav(`/jobs?q=${encodeURIComponent(q)}${where?`&city=${encodeURIComponent(where)}`:''}`);
    else nav(`/jobs${where?`?city=${encodeURIComponent(where)}`:''}`);
  }

  return (
    <div className="fade-in" style={{maxWidth:1040, margin:'0 auto'}}>
      <section className="salary-hero" style={{padding:'2.5rem 0 1.25rem'}}>
        <h1 style={{fontSize:'2.1rem',margin:'0 0 .35rem'}}>{t('salary.discover')}</h1>
        <p className="muted" style={{margin:0}}>{t('salary.intro')}</p>
        <form onSubmit={onSearch} className="hero-search" style={{marginTop:'1rem'}}>
          <input placeholder={t('salary.what')} value={what} onChange={e=>setWhat(e.target.value)} />
          <span className="sep" aria-hidden />
          <input placeholder={t('salary.where')} value={where} onChange={e=>setWhere(e.target.value)} />
          <button className="btn">{t('home.search')}</button>
        </form>
      </section>

      <section style={{margin:'1.2rem 0'}}>
        <h2 style={{margin:'0 0 .4rem'}}>{t('salary.browseTop')}</h2>
        <div style={{display:'flex', alignItems:'center', gap:'.6rem', margin:'0 0 1rem'}}>
          <label style={{margin:0}}>{t('salary.chooseLevel')}</label>
          <select value={level} onChange={e=>setLevel(e.target.value)} style={{maxWidth:220}}>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="salary-grid">
          {filtered.map(r => (
            <div
              key={r.title}
              className="salary-card card salary-card-upgraded"
              style={{borderRadius:'16px'}}
              role="button"
              tabIndex={0}
              onClick={()=>openDetail(r)}
              onKeyDown={e=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); openDetail(r); } }}
              aria-label={`View salary details for ${r.title}`}
            >
              <button
                type="button"
                onClick={(e)=>{ e.stopPropagation(); openDetail(r); }}
                title="View details"
                className="arrow-btn arrow-abs"
                aria-label="Open salary details"
              >
                ›
              </button>
              <div className="salary-card-head">
                <div className="level-badge" aria-label={`Level ${r.level}`}>{r.level}</div>
              </div>
              <div className="salary-card-main">
                <div className="title-row">
                  <div className="role-title">{r.title}</div>
                </div>
                <div className="meta-row">
                  <span className="avg-pill">{t('salary.avg')}: ₹{r.avg.toLocaleString()} / yr</span>
                </div>
              </div>
              <div className="salary-card-footer">
                <a
                  href={`/jobs?q=${encodeURIComponent(r.title)}`}
                  onClick={e=>{ e.preventDefault(); e.stopPropagation(); nav(`/jobs?q=${encodeURIComponent(r.title)}`); }}
                >{t('salary.openings')}</a>
                <span className="ghost">{t('salary.tap')}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
