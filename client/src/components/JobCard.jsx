import { Link } from 'react-router-dom';

export default function JobCard({ job, compact=false }) {
  const statusClass = job.status && job.status !== 'approved' ? job.status : 'approved';
  const salary = job.pay_scale || (job.salary_min ? `${job.salary_min.toLocaleString()}${job.salary_max ? ' - ' + job.salary_max.toLocaleString():''}` : '');
  return (
    <div className={`card fade-in${compact ? ' card-compact': ''}`}> 
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'.75rem' }}>
        <div style={{ flex:1 }}>
          <h3 style={{ marginTop:0, marginBottom:'.25rem', fontSize:'1.05rem', lineHeight:1.25 }}>
            <Link to={`/jobs/${job.id}`}>{job.title}</Link>
          </h3>
          <div style={{ fontSize:'.62rem', textTransform:'uppercase', letterSpacing:'.6px', opacity:.85, marginBottom:'.4rem', fontWeight:600 }}>
            {job.institution_name || job.employer_name} {job.city ? '· ' + job.city : ''}
          </div>
          <div style={{ display:'flex', gap:'.35rem', flexWrap:'wrap', fontSize:'.6rem', letterSpacing:'.5px' }}>
            {job.employment_type && <span className="badge-status">{job.employment_type}</span>}
            {job.organization_type && <span className="badge-status">{job.organization_type}</span>}
            {job.subject && <span className="badge-status">{job.subject}</span>}
            {job.grade_level && <span className="badge-status">Grade {job.grade_level}</span>}
            {job.remote_allowed ? <span className="badge-status">Remote</span> : (job.city && <span className="badge-status">{job.city}</span>)}
            {salary && <span className="badge-status">{salary}</span>}
            <span className={`badge-status ${statusClass}`}>{statusClass}</span>
          </div>
        </div>
        <Link to={`/jobs/${job.id}`} className="btn btn-sm">View</Link>
      </div>
      {job.description && <p style={{ fontSize:'.7rem', lineHeight:1.4, maxHeight: compact ? '2.4em':'3.0em', overflow:'hidden', marginBottom:0 }}>{job.description}</p>}
    </div>
  );
}

