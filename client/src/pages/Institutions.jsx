import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../util/api.js';
import { useAuth } from '../state/AuthContext.jsx';

function Star({ filled }){
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled? 'currentColor':'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 17.3 6.2 20l1.1-6.5L2 8.9l6.6-1L12 2l3.4 5.9 6.6 1-5.3 4.6 1.1 6.5-5.8-2.7Z" />
    </svg>
  );
}

export default function Institutions(){
  const { t } = useTranslation();
  const [all, setAll] = React.useState([]);
  const [q, setQ] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  React.useEffect(()=>{
    let on = true;
    (async()=>{
      try{
        const res = await api.get('/institutions');
        if(on){ setAll(res.institutions || []); }
      }finally{ if(on) setLoading(false); }
    })();
    return ()=>{ on = false };
  },[]);

  const list = React.useMemo(()=>{
    const f = (q||'').toLowerCase().trim();
    const filtered = f ? all.filter(x => (x.name||'').toLowerCase().includes(f)) : all;
    return filtered;
  }, [all, q]);

  function onClickInstitution(c){
    const key = String((c.name||'') || c.id).toLowerCase();
    const toDash = `/dashboard/teacher?review_for=${encodeURIComponent(key)}&name=${encodeURIComponent(c.name||'Institution')}`;
    if (!user) {
      navigate('/login', { state: { from: { pathname: toDash } } });
    } else if (user.role !== 'teacher') {
      // Non-teachers cannot review; send to login to switch
      navigate('/login', { state: { from: { pathname: toDash } } });
    } else {
      navigate(toDash);
    }
  }

  return (
    <div className="fade-in" style={{maxWidth:980, margin:'0 auto'}}>
      <div style={{padding:'2.5rem 0 1rem'}}>
    <h1 style={{fontSize:'2.2rem',margin:'0 0 .35rem'}}>{t('institutions.title')}</h1>
  <p className="muted" style={{margin:0}}>{t('institutions.sub')}</p>
        <form onSubmit={e=>e.preventDefault()} className="inst-search">
          <label className="inst-label">Institution name or job title</label>
          <div className="inst-bar">
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder={t('institutions.placeholder')} />
            <button className="btn">{t('institutions.find')}</button>
          </div>
          <div style={{marginTop:'.6rem'}}>
            <a
              href="/salary"
              className="muted"
              onClick={e=>{ e.preventDefault(); navigate('/salary'); }}
            >{t('institutions.searchSalaries')}</a>
          </div>
        </form>
      </div>

      <section style={{marginTop:'1.2rem'}}>
        <h2 style={{margin:'0 0 .3rem'}}>{t('institutions.all')}</h2>
        {!loading && (
          <div className="muted" style={{margin:'0 0 .8rem'}}>
            {t('institutions.showing', { count: list.length, plural: list.length===1?'':'s' })}
          </div>
        )}
        <div className="inst-grid">
          {loading && <div className="card">Loading…</div>}
          {!loading && list.map((c)=>{
            const full = Math.floor(c.rating);
            const half = (c.rating - full) >= 0.5;
            return (
              <div key={c.id+String(c.name)} className="inst-card" onClick={()=>onClickInstitution(c)} style={{ cursor:'pointer' }}>
                <div className="inst-logo" aria-hidden>{(c.name||'?').slice(0,2)}</div>
                <div className="inst-meta">
                  <div className="inst-name">{c.name}</div>
                  <div className="inst-stars">
                    {[0,1,2,3,4].map(i=> <Star key={i} filled={i < Math.round(c.rating)} />)}
                    <span className="inst-rev">{c.reviews.toLocaleString()} reviews</span>
                  </div>
                  <div className="inst-links">
                    <span>{t('institutions.links.salaries')}</span>
                    <span>{t('institutions.links.questions')}</span>
                    <span>{t('institutions.links.openJobs')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
