export default function About() {
  const year = new Date().getFullYear();
  return (
    <div className="fade-in" style={{display:'grid',gap:'var(--space-8)',marginTop:'var(--space-7)'}}>
      <section style={{maxWidth:880,margin:'0 auto',textAlign:'center',display:'grid',gap:'var(--space-5)'}}>
        <h1 style={{margin:'0 0 var(--space-4)',fontSize:'clamp(2.2rem,4vw,3.1rem)',background:'var(--color-gradient-1)',WebkitBackgroundClip:'text',color:'transparent'}}>About JobPortal</h1>
        <p className='hero-lead' style={{margin:0}}>JobPortal is a focused hiring platform built exclusively for the education ecosystem—helping <strong style={{color:'var(--color-primary)'}}>universities, institutes, schools & NGOs</strong> find passionate educators, and enabling teachers to present their expertise with clarity.</p>
      </section>

      <section className='grid' style={{gap:'var(--space-6)',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))'}}>
        {[{t:'Education First',d:'Every feature is tailored to academic hiring—subjects, grade bands, experience & credentials.'},{t:'Transparent Roles',d:'Clear metadata: institution type, pay scale, experience, remote options & application deadlines.'},{t:'Efficient Matching',d:'Teachers search precisely; employers filter quickly—reducing noise & time-to-hire.'},{t:'Scalable Foundation',d:'Modern stack ready for future modules: messaging, analytics, verification & assessments.'}].map(x=> (
          <div key={x.t} className='card' style={{padding:'var(--space-5) var(--space-5)'}}>
            <h3 style={{marginTop:0,marginBottom:'var(--space-3)'}}>{x.t}</h3>
            <p style={{margin:0,fontSize:'var(--font-size-sm)',color:'var(--color-text-dim)'}}>{x.d}</p>
          </div>
        ))}
      </section>

      <section style={{display:'grid',gap:'var(--space-5)'}}>
        <h2 style={{margin:0,textAlign:'center'}}>Who It Serves</h2>
        <div className='grid' style={{gap:'var(--space-5)',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))'}}>
          <div className='card'><strong>Teachers & Faculty</strong><p className='muted' style={{fontSize:'var(--font-size-sm)'}}>Showcase subjects, grade experience, research focus, and skills while tracking relevant openings.</p></div>
          <div className='card'><strong>Institutions</strong><p className='muted' style={{fontSize:'var(--font-size-sm)'}}>Post enriched roles with deadlines, pay scale, and responsibilities for better applicant quality.</p></div>
          <div className='card'><strong>NGOs & Initiatives</strong><p className='muted' style={{fontSize:'var(--font-size-sm)'}}>Reach educators passionate about social impact and community-based education.</p></div>
          <div className='card'><strong>Upskilling Platforms</strong><p className='muted' style={{fontSize:'var(--font-size-sm)'}}>Target instructors for data science, AI, design, test prep & professional programs.</p></div>
        </div>
      </section>

      <section style={{display:'grid',gap:'var(--space-5)'}}>
        <h2 style={{margin:0,textAlign:'center'}}>Current Feature Set</h2>
        <div className='grid' style={{gap:'var(--space-4)',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))'}}>
          {['Role-based auth','Teacher profiles','Employer job posting','Advanced job filters','Rich job metadata','Remote & active filters','Schema migrations','Seeded sample data','Dark UI design system'].map(f => (
            <div key={f} className='card card-muted' style={{padding:'var(--space-4)'}}><span style={{fontSize:'var(--font-size-sm)',fontWeight:600}}>{f}</span></div>
          ))}
        </div>
      </section>

      <section style={{display:'grid',gap:'var(--space-5)'}}>
        <h2 style={{margin:0,textAlign:'center'}}>Technology Stack</h2>
        <div className='card' style={{maxWidth:1000,margin:'0 auto',display:'grid',gap:'var(--space-4)'}}>
          <div style={{display:'flex',flexWrap:'wrap',gap:'var(--space-4)',fontSize:'var(--font-size-sm)'}}>
            <div><strong>Frontend:</strong> React + Vite, modular CSS design system</div>
            <div><strong>Backend:</strong> Node.js (Express) + better-sqlite3</div>
            <div><strong>Auth:</strong> JWT (role-based)</div>
            <div><strong>DB:</strong> SQLite with lightweight migrations</div>
            <div><strong>Build:</strong> Scripts & seed runners</div>
          </div>
          <p className='muted' style={{margin:0,fontSize:'var(--font-size-xs)'}}>Optimized for fast local development and future portability to Postgres or cloud environments.</p>
        </div>
      </section>

      <section style={{display:'grid',gap:'var(--space-5)'}}>
        <h2 style={{margin:0,textAlign:'center'}}>Upcoming Roadmap</h2>
        <div className='grid' style={{gap:'var(--space-4)',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))'}}>
          {[{k:'Notifications',d:'Automated status & deadline alerts'},{k:'Applicant Tracking',d:'Employer pipeline views'},{k:'Messaging',d:'Secure teacher–employer chat'},{k:'Verification',d:'Credential validation workflows'},{k:'Sorting & Pagination',d:'Performance on large datasets'},{k:'Analytics',d:'Hiring & application insights'}].map(r => (
            <div key={r.k} className='card' style={{padding:'var(--space-4)'}}>
              <div style={{fontWeight:600,fontSize:'.85rem',marginBottom:'var(--space-2)'}}>{r.k}</div>
              <div className='muted' style={{fontSize:'var(--font-size-xs)'}}>{r.d}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{display:'grid',gap:'var(--space-4)',maxWidth:880,margin:'0 auto',textAlign:'center'}}>
        <h2 style={{margin:0}}>Principles</h2>
        <p style={{margin:0}} className='muted'>Clarity over clutter · Fast feedback loops · Accessibility-minded typography & contrast · Incremental extensibility.</p>
      </section>

      <section style={{display:'grid',gap:'var(--space-4)',maxWidth:760,margin:'0 auto',textAlign:'center'}}>
        <h2 style={{margin:0}}>Get Support</h2>
        <p style={{margin:0}} className='muted'>Have an idea or need a feature prioritized? Extend the backend, add a migration, then surface it via clean UI components—this codebase is intentionally approachable.</p>
      </section>

      <footer style={{textAlign:'center',fontSize:'var(--font-size-xs)',color:'var(--color-text-dim)',marginTop:'var(--space-4)'}}>© {year} JobPortal • Built for modern education hiring.</footer>
    </div>
  );
}
