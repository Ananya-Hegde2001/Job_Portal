import { useState, useEffect } from 'react';

const orgTypes = ['', 'government','public_university','deemed','private','international_school','ngo'];
const empTypes = ['', 'full_time','part_time','contract','temporary','guest','visiting'];

export default function JobFilters({ value, onChange }) {
  const blank = { q:'', subject:'', grade:'', location:'', city:'', organization_type:'', employment_type:'', min_experience:'', remote:'', active:false };
  const [form, setForm] = useState(value || blank);
  useEffect(()=>{ setForm(prev => ({ ...prev, ...value })); }, [value]);
  function update(e){ const f={...form,[e.target.name]: e.target.type==='checkbox' ? e.target.checked : e.target.value}; setForm(f); }
  function submit(e){ e.preventDefault(); onChange(form); }
  function clear(){ setForm(blank); onChange(blank); }
  return (
    <form onSubmit={submit} className="jobs-filters card">
      <div className="jobs-filters-header">
        <h3>Filters</h3>
        <button type="button" className="btn-outline btn-sm" onClick={clear} style={{padding:'4px 10px',fontSize:'.6rem'}}>Reset</button>
      </div>
      <div className="jobs-filter-scroll">
        <div className="filter-row">
          <div>
            <label>Keyword</label>
            <input name="q" value={form.q} onChange={update} placeholder="Title, institution..." />
          </div>
          <div>
            <label>Subject</label>
            <input name="subject" value={form.subject} onChange={update} placeholder="Math, CS" />
          </div>
        </div>
        <div className="filter-row">
          <div>
            <label>Grade</label>
            <input name="grade" value={form.grade} onChange={update} placeholder="6-8 / UG / PG" />
          </div>
          <div>
            <label>State / Region</label>
            <input name="location" value={form.location} onChange={update} placeholder="Karnataka" />
          </div>
        </div>
        <div className="filter-row">
          <div>
            <label>City</label>
            <input name="city" value={form.city} onChange={update} placeholder="Bengaluru" />
          </div>
          <div>
            <label>Org Type</label>
            <select name="organization_type" value={form.organization_type} onChange={update}>
              {orgTypes.map(o => <option key={o} value={o}>{o||'Any'}</option>)}
            </select>
          </div>
        </div>
        <div className="filter-row">
          <div>
            <label>Employment</label>
            <select name="employment_type" value={form.employment_type} onChange={update}>
              {empTypes.map(o => <option key={o} value={o}>{o||'Any'}</option>)}
            </select>
          </div>
          <div>
            <label>Max Exp (≤ yrs)</label>
            <input name="min_experience" value={form.min_experience} onChange={update} placeholder="3" />
          </div>
        </div>
        <div className="filter-row">
          <div>
            <label>Remote</label>
            <select name="remote" value={form.remote} onChange={update}>
              <option value="">Any</option>
              <option value="1">Allowed</option>
              <option value="0">On-site</option>
            </select>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end' }}>
            <label style={{ display:'flex', gap:'.45rem', alignItems:'center', marginBottom:0 }}>
              <input type="checkbox" name="active" checked={form.active} onChange={update} style={{ width:'auto' }} /> Active
            </label>
          </div>
        </div>
      </div>
      <button className="btn btn-sm" type="submit" style={{marginTop:'4px'}}>Apply Filters</button>
    </form>
  );
}
