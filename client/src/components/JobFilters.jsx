import { useState, useEffect } from 'react';

const orgTypes = ['', 'government','public_university','deemed','private','international_school','ngo'];
const empTypes = ['', 'full_time','part_time','contract','temporary','guest','visiting'];

export default function JobFilters({ value, onChange }) {
  const blank = { q:'', subject:'', grade:'', location:'', city:'', organization_type:'', employment_type:'', min_experience:'', mode:'' };
  const [form, setForm] = useState(value || blank);
  useEffect(()=>{ setForm(prev => ({ ...prev, ...value })); }, [value]);
  function update(e){ const f={...form,[e.target.name]: e.target.type==='checkbox' ? e.target.checked : e.target.value}; setForm(f); }
  function submit(e){ e.preventDefault(); onChange(form); }
  function clear(){ setForm(blank); onChange(blank); }
  return (
    <form onSubmit={submit} className="jobs-filters card">
      <div className="jobs-filters-header">
        <h3>Filters</h3>
        <button
          type="button"
          onClick={clear}
          className="btn-sm"
          style={{
            padding:'4px 12px',
            fontSize:'.6rem',
            fontWeight:600,
            background:'var(--color-surface-alt)',
            border:'1px solid var(--color-border)',
            borderRadius:'8px',
            color:'var(--color-text-dim)',
            cursor:'pointer',
            lineHeight:1.1,
            transition:'var(--transition-fast)'
          }}
          onMouseOver={e=>{ e.currentTarget.style.background='var(--color-surface)'; e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='var(--color-border-strong)'; }}
          onMouseOut={e=>{ e.currentTarget.style.background='var(--color-surface-alt)'; e.currentTarget.style.color='var(--color-text-dim)'; e.currentTarget.style.borderColor='var(--color-border)'; }}
        >Reset</button>
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
            <label>Mode</label>
            <select name="mode" value={form.mode} onChange={update}>
              <option value="">Any</option>
              <option value="remote">Remote</option>
              <option value="onsite">On-site</option>
              <option value="tuition">Tuition</option>
              <option value="school">School</option>
              <option value="college">College/University</option>
            </select>
          </div>
        </div>
      </div>
      <div style={{ textAlign:'center', marginTop:'6px' }}>
        <button className="btn btn-sm" type="submit" style={{ padding:'0.55rem 1.75rem', minWidth:'150px' }}>Apply Filters</button>
      </div>
    </form>
  );
}
