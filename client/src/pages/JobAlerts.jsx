import { useEffect, useState } from 'react';
import { api } from '../util/api.js';

export default function JobAlerts(){
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load(){
    try{
      setLoading(true); setError(null);
      const res = await api.listAlerts();
      setAlerts(res.alerts || []);
    } catch(e){ setError(e?.message || 'Failed to load alerts'); }
    finally{ setLoading(false); }
  }

  useEffect(()=>{ load(); },[]);

  async function remove(id){
    try{
      await api.deleteAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch(e){ alert(e?.message || 'Failed to delete'); }
  }

  return (
    <section className="layout" style={{marginTop:'1rem'}}>
      <div className="card" style={{padding:'1rem 1.1rem'}}>
        <h2 style={{margin:'0 0 .6rem'}}>Job Alerts</h2>
        {loading && <p className="muted">Loading…</p>}
        {error && <p style={{color:'var(--color-danger)'}}>{error}</p>}
        {!loading && !error && alerts.length===0 && (
          <p className="muted">No alerts yet. Create one from the Jobs page search.</p>
        )}
        <div className="list-clean" style={{marginTop:'.5rem'}}>
          {alerts.map(a => (
            <div key={a.id} className="row-line">
              <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap',alignItems:'center'}}>
                {a.subject && <span className="pill">Subject: {a.subject}</span>}
                {a.location && <span className="pill">Location: {a.location}</span>}
                {!a.subject && !a.location && <span className="muted">(Any jobs)</span>}
              </div>
              <button className="btn btn-sm btn-danger" onClick={()=>remove(a.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
