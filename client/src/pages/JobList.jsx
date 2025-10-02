import { useEffect, useState, useMemo } from 'react';
import { api } from '../util/api.js';
import JobCard from '../components/JobCard.jsx';
import JobFilters from '../components/JobFilters.jsx';
import { useLocation, useNavigate } from 'react-router-dom';

export default function JobList() {
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [quickQ, setQuickQ] = useState('');
  const [quickCity, setQuickCity] = useState('');

  function buildParams(f = {}) {
    const params = new URLSearchParams();
    if (f.q) params.append('q', f.q);
    if (f.subject) params.append('subject', f.subject);
    if (f.grade) params.append('grade', f.grade);
    if (f.location) params.append('location', f.location);
    if (f.city) params.append('city', f.city);
    if (f.organization_type) params.append('organization_type', f.organization_type);
    if (f.employment_type) params.append('employment_type', f.employment_type);
    if (f.min_experience) params.append('min_experience', f.min_experience);
    if (f.mode !== '' && f.mode !== undefined) params.append('mode', f.mode);
    if (f.active) params.append('active', '1');
    return params;
  }
  function load(f = {}) {
    setLoading(true); setError(null);
    const params = buildParams(f);
    api.get('/jobs' + (params.toString() ? `?${params}` : ''))
      .then(r => { setJobs(r.jobs||[]); })
      .catch(e => { console.error('Jobs fetch failed', e); setError(e.message); })
      .finally(() => setLoading(false));
  }
  // Initialize from URL query (supports coming from home search)
  useEffect(() => {
    const qParams = Object.fromEntries(new URLSearchParams(location.search));
    if (Object.keys(qParams).length) {
      // Backward compatibility: translate legacy remote=1/0 to mode
      if (qParams.remote && !qParams.mode) {
        if (qParams.remote === '1') qParams.mode = 'remote';
        else if (qParams.remote === '0') qParams.mode = 'onsite';
      }
      const initFilters = { ...filters, ...qParams };
      setFilters(initFilters);
      setQuickQ(qParams.q||'');
      setQuickCity(qParams.city||'');
      load(initFilters);
    } else {
      load(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function onFilter(f){ setFilters(f); const params = buildParams(f); navigate('/jobs'+(params.toString()?`?${params}`:''), { replace:true }); load(f); }

  function runQuickSearch(e){ e.preventDefault(); const next = { ...filters, q: quickQ, city: quickCity }; setFilters(next); onFilter(next); }

  const activeChips = useMemo(()=>{
    const map = { subject:'Subject', grade:'Grade', city:'City', location:'Region', organization_type:'Org', employment_type:'Type', min_experience:'MaxExp', mode:'Mode', active:'Active' };
    const prettyMode = { remote:'Remote', onsite:'On-site', tuition:'Tuition', school:'School', college:'College/University' };
    return Object.entries(filters)
      .filter(([k,v])=> v && v!=='' && v!==false)
      .map(([k,v])=> ({ key:k, label: map[k]||k, value: k==='mode' ? (prettyMode[v]||v) : v }));
  }, [filters]);
  function clearChip(key){ const next={...filters,[key]: key==='active'?false:''}; setFilters(next); onFilter(next); }
  return (
    <div className="jobs-layout">
      <div className="jobs-sidebar"><JobFilters value={filters} onChange={onFilter} /></div>
      <div className="jobs-main">
        <div className="jobs-header card">
          <form onSubmit={runQuickSearch} className="jobs-search-bar">
            <input value={quickQ} onChange={e=>setQuickQ(e.target.value)} placeholder='Search jobs...' />
            <div className="jobs-search-divider" />
            <input value={quickCity} onChange={e=>setQuickCity(e.target.value)} placeholder='City or remote' />
            <button className='btn btn-sm'>Search</button>
          </form>
          {activeChips.length>0 && (
            <div className="jobs-chips">
              {activeChips.map(c => (
                <span key={c.key} className="chip" onClick={()=>clearChip(c.key)}>{c.label}: {c.value} ✕</span>
              ))}
              <button className="chip-clear" onClick={()=>{ onFilter({}); setFilters({}); }}>Clear All</button>
            </div>
          )}
          <div className="jobs-header-meta">
            <h2>Open Teaching Roles</h2>
            {!loading && !error && <div className="result-count">{jobs.length} result{jobs.length!==1?'s':''}</div>}
          </div>
        </div>
        {loading && <p className="muted" style={{padding:'1rem 0'}}>Loading jobs…</p>}
        {error && <p style={{ color: 'var(--color-danger)', padding:'1rem 0' }}>{error}</p>}
        {!loading && !error && !jobs.length && <p className="muted" style={{padding:'1rem 0'}}>No jobs found.</p>}
        <div className="grid grid-auto">
          {jobs.map(j => <JobCard key={j.id} job={j} />)}
        </div>
      </div>
    </div>
  );
}
