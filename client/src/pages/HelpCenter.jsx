import React from 'react';
import { Link } from 'react-router-dom';

function CatIcon({ type='guide' }) {
  const base = { width:22, height:22, stroke:'currentColor', strokeWidth:1.6, fill:'none', strokeLinecap:'round', strokeLinejoin:'round' };
  switch (type) {
    case 'teacher': return <svg {...base} viewBox="0 0 24 24"><circle cx="12" cy="7" r="3"/><path d="M5 21a7 7 0 0 1 14 0"/></svg>;
    case 'employer': return <svg {...base} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg>;
    case 'apply': return <svg {...base} viewBox="0 0 24 24"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>;
    case 'security': return <svg {...base} viewBox="0 0 24 24"><path d="M12 2 3 6v6c0 5 3.4 9.4 9 10 5.6-.6 9-5 9-10V6Z"/><path d="M9 12l2 2 4-4"/></svg>;
    case 'bug': return <svg {...base} viewBox="0 0 24 24"><path d="M8 4v3m8-3v3M3 13h18M5 7a7 7 0 0 0 14 0"/></svg>;
    default: return <svg {...base} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>;
  }
}

function Accordion({ items, query }) {
  const [open, setOpen] = React.useState({});
  const q = (query||'').toLowerCase().trim();
  const filtered = q
    ? items.filter(it => it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q))
    : items;
  return (
    <div className="accord">
      {filtered.map((it, idx) => {
        const id = it.q;
        const isOpen = !!open[id];
        return (
          <div key={id+idx} className={'accord-item'+(isOpen?' open':'')}>
            <button className="accord-q" onClick={()=>setOpen(s=>({ ...s, [id]: !s[id] }))}>
              <span>{it.q}</span>
              <span className="accord-ic" aria-hidden>{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
              <div className="accord-a">
                <p>{it.a}</p>
                {it.links && it.links.length>0 && (
                  <div className="accord-links">
                    {it.links.map((l,i)=> l.to ? <Link key={i} to={l.to}>{l.label}</Link> : <a key={i} href={l.href} target="_blank" rel="noreferrer">{l.label}</a>)}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      {filtered.length===0 && (
        <div className="empty-block" style={{ padding:'2rem 1rem' }}>No results for “{query}”.</div>
      )}
    </div>
  );
}

export default function HelpCenter() {
  const [query, setQuery] = React.useState('');
  const sections = [
    { id:'getting-started', title:'Getting Started', icon:'guide' },
    { id:'for-teachers', title:'For Teachers', icon:'teacher' },
    { id:'for-employers', title:'For Employers', icon:'employer' },
    { id:'applications', title:'Applications & Interviews', icon:'apply' },
    { id:'profile-security', title:'Profile & Security', icon:'security' },
    { id:'troubleshooting', title:'Troubleshooting', icon:'bug' },
    { id:'contact', title:'Contact & Support', icon:'guide' }
  ];
  const faqs = {
    'getting-started': [
      { q:'How do I create an account?', a:'Click Register in the top-right and select your role (Teacher or Employer). Fill in the details to sign up.', links:[{ to:'/signup', label:'Create Account' }] },
      { q:'What should I do first after signup?', a:'Complete your profile. Teachers should add subjects, bio, Top Skills, and upload resume. Employers should add institution details and post a job.' },
    ],
    'for-teachers': [
      { q:'How to add Top Skills?', a:'On your Profile page, use the Top Skills chips to add or remove skills. These improve job matching in your dashboard.' , links:[{ to:'/profile', label:'Open Profile' }]},
      { q:'How to get job recommendations?', a:'In your Teacher Dashboard → Search Jobs tab, roles are ranked based on overlap with your Top Skills.' , links:[{ to:'/dashboard/teacher?tab=search', label:"Go to Search Jobs"}]},
      { q:'Where do I upload my resume?', a:'From your Teacher Dashboard sidebar, use Upload/Update Resume to attach a PDF/DOC.' , links:[{ to:'/dashboard/teacher', label:'Open Teacher Dashboard' }]},
    ],
    'for-employers': [
      { q:'How to post a job?', a:'Use the Post Job button (for Employers). Provide clear title, description, and skills_required for better matching.' , links:[{ to:'/post-job', label:'Post a Job' }]},
      { q:'How to manage applicants?', a:'Go to Employer Dashboard to review applications and update their statuses.' , links:[{ to:'/dashboard/employer', label:'Employer Dashboard' }]},
    ],
    'applications': [
      { q:'What do application statuses mean?', a:'Submitted: received; Shortlisted: progressed to next steps; Rejected: not moving forward; Hired: selected for the role.' },
      { q:'Where can I see updates?', a:'Check Dashboard → Notifications tab for your latest application updates.' , links:[{ to:'/dashboard/teacher?tab=notifications', label:'Notifications' }]},
    ],
    'profile-security': [
      { q:'How to update name or phone?', a:'Open Profile and edit the top section (10‑digit phone format is required).' , links:[{ to:'/profile', label:'Open Profile' }]},
      { q:'I forgot my password.', a:'Use Forgot Password to receive reset instructions, then complete the reset flow.' , links:[{ to:'/forgot', label:'Forgot Password' }, { to:'/reset', label:'Reset' }]},
      { q:'What files can I upload?', a:'Resume: PDF/DOC/DOCX up to 20MB. Avatar: PNG/JPEG/WEBP up to 5MB.' },
    ],
    'troubleshooting': [
      { q:'The page is not updating.', a:'Try a hard refresh, or clear cache, and ensure you’re on the latest build.' },
      { q:'Upload keeps failing.', a:'Check allowed file types/sizes, and ensure you have a stable internet connection.' },
      { q:'I cannot log in.', a:'Verify your email and password, or reset your password. Try a different browser if the issue persists.' , links:[{ to:'/forgot', label:'Forgot Password' }]},
    ],
  };

  const allFaqs = Object.values(faqs).flat();
  const hasQuery = query.trim().length > 0;
  const searchItems = hasQuery ? allFaqs : [];

  return (
    <div className="fade-in" style={{ marginTop:'0.5rem' }}>
      {/* Docs-style Hero */}
      <section className="help-doc-hero">
        <div className="help-doc-hero-inner">
          <div className="help-breadcrumb">Support / Help Center</div>
          <h1 className="help-title">Help Center</h1>
          <p className="help-sub">Clear, concise guidance for teachers and employers. Search tips, how‑tos, and FAQs.</p>
          <div className="help-search flat">
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search help articles (e.g., resume, skills, post job)" />
            <button className="btn-outline">Search</button>
          </div>
        </div>
      </section>

      <div className="layout" style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:'1.25rem', alignItems:'start' }}>
        {/* Sidebar */}
        <aside style={{ position:'sticky', top:'calc(var(--nav-height) + 18px)' }}>
          <div className="card" style={{ padding:'.85rem' }}>
            <div style={{ fontSize:'.75rem', fontWeight:700, letterSpacing:'.6px', margin:'0 0 .5rem' }}>Browse Topics</div>
            <nav style={{ display:'grid', gap:'.25rem' }}>
              {sections.map(s => (
                <a key={s.id} href={'#'+s.id} style={{ color:'var(--color-text-dim)', fontSize:'.85rem' }}>{s.title}</a>
              ))}
            </nav>
          </div>
          <div className="card card-muted" style={{ marginTop:'.9rem' }}>
            <div style={{ fontSize:'.75rem', fontWeight:700, letterSpacing:'.6px', marginBottom:'.4rem' }}>Need more help?</div>
            <p className="muted" style={{ margin:'0 0 .6rem' }}>Reach our team for assistance.</p>
            <a className="btn btn-sm" href="mailto:shettyrithika12@gmail.com">Email Support</a>
          </div>
        </aside>

        {/* Main */}
        <main style={{ display:'grid', gap:'1.1rem' }}>
          {/* Topic Cards (distinct from homepage tiles) */}
          <section className="card">
            <div className="topic-head">
              <h2>Browse Topics</h2>
              <p>Select a category to jump to relevant guidance.</p>
            </div>
            <div className="topic-list">
              {sections.slice(0,6).map(s => (
                <a key={s.id} href={'#'+s.id} className="topic-card">
                  <span className="topic-ic"><CatIcon type={s.icon} /></span>
                  <span className="topic-meta">
                    <span className="topic-name">{s.title}</span>
                    <span className="topic-more">Open section</span>
                  </span>
                </a>
              ))}
            </div>
          </section>

          {/* Search Results */}
          {hasQuery && (
            <section className="card">
              <div className="section-head">
                <h2>Search Results</h2>
                <p>Showing answers matching “{query}”.</p>
              </div>
              <Accordion items={searchItems} query={query} />
            </section>
          )}

          {/* Sectioned FAQs */}
          <section id="getting-started" className="card">
            <h3 style={{ margin:'0 0 .35rem' }}>Getting Started</h3>
            <Accordion items={faqs['getting-started']} query={hasQuery ? query : ''} />
          </section>

          <section id="for-teachers" className="card">
            <h3 style={{ margin:'0 0 .35rem' }}>For Teachers</h3>
            <Accordion items={faqs['for-teachers']} query={hasQuery ? query : ''} />
          </section>

          <section id="for-employers" className="card">
            <h3 style={{ margin:'0 0 .35rem' }}>For Employers</h3>
            <Accordion items={faqs['for-employers']} query={hasQuery ? query : ''} />
          </section>

          <section id="applications" className="card">
            <h3 style={{ margin:'0 0 .35rem' }}>Applications & Interviews</h3>
            <Accordion items={faqs['applications']} query={hasQuery ? query : ''} />
          </section>

          <section id="profile-security" className="card">
            <h3 style={{ margin:'0 0 .35rem' }}>Profile & Security</h3>
            <Accordion items={faqs['profile-security']} query={hasQuery ? query : ''} />
          </section>

          <section id="troubleshooting" className="card">
            <h3 style={{ margin:'0 0 .35rem' }}>Troubleshooting</h3>
            <Accordion items={faqs['troubleshooting']} query={hasQuery ? query : ''} />
          </section>

          {/* Contact */}
          <section id="contact" className="card card-muted">
            <h3 style={{ margin:'0 0 .35rem' }}>Contact & Support</h3>
            <p className="muted" style={{ marginTop:0 }}>Didn’t find what you need? We’re happy to assist.</p>
            <div style={{ display:'flex', gap:'.6rem', flexWrap:'wrap', alignItems:'center' }}>
              <a className="btn" href="mailto:shettyrithika12@gmail.com">Email Support</a>
              <Link className="btn btn-outline" to="/about">About the Platform</Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

