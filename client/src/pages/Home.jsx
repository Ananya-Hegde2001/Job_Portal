import { Link, useNavigate } from 'react-router-dom';
import React from 'react';

export default function Home(){
  const nav = useNavigate();
  const [q,setQ] = React.useState('');
  const [city,setCity] = React.useState('');
  function onSearch(e){ e.preventDefault(); const p=new URLSearchParams(); if(q) p.set('q', q); if(city) p.set('city', city); nav('/jobs?'+p.toString()); }
  const stats = [
    { label:'Active Jobs', value:'2.4k+' },
    { label:'Universities', value:'1.1k+' },
    { label:'Educators', value:'18k+' },
    { label:'Match Rate', value:'94%' }
  ];
  // Curated domain categories (six popular domains)
  const categories = [
    { name:'EdTech', icon:'stem' },
    { name:'College', icon:'research' },
    { name:'School', icon:'admin' },
    { name:'Pre-School', icon:'special' },
    { name:'Vocational Training', icon:'lang' },
    { name:'Coaching', icon:'sports' }
  ];

  function CatIcon({ type }) {
    const baseProps = { width:26, height:26, stroke:'currentColor', strokeWidth:1.6, fill:'none', strokeLinecap:'round', strokeLinejoin:'round' };
    switch(type){
      case 'stem': return <svg {...baseProps} viewBox="0 0 24 24"><path d="M8 3h8M10 3v6.5a4 4 0 1 0 4 0V3"/><path d="M6 21h12"/><path d="M9.5 17h5"/></svg>;
      case 'arts': return <svg {...baseProps} viewBox="0 0 24 24"><path d="M4 4h9v9H4z"/><path d="M13 7h3a4 4 0 1 1 0 8h-3"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="7" cy="7" r="1" fill="currentColor"/><circle cx="7" cy="11" r="1" fill="currentColor"/><circle cx="11" cy="7" r="1" fill="currentColor"/><circle cx="11" cy="11" r="1" fill="currentColor"/></svg>;
      case 'lang': return <svg {...baseProps} viewBox="0 0 24 24"><path d="M4 5h16M4 12h16M4 19h16"/><path d="M8 5c1.2 4.5 3.2 7.5 6 9.5"/><path d="M16 5c-.8 3-2.1 5.5-4 7.5"/></svg>;
      case 'admin': return <svg {...baseProps} viewBox="0 0 24 24"><path d="M3 11h18M5 21h14"/><path d="M7 11V7l5-4 5 4v4"/><path d="M10 21v-6h4v6"/></svg>;
      case 'research': return <svg {...baseProps} viewBox="0 0 24 24"><circle cx="10" cy="10" r="5"/><path d="m21 21-6-6"/></svg>;
      case 'sports': return <svg {...baseProps} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M5.5 5.5 18.5 18.5M5.5 18.5 18.5 5.5"/></svg>;      case 'special': return <svg {...baseProps} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19 3 5 17M5 3l14 14"/></svg>;
      default: return <svg {...baseProps} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>;
    }
  }
  const features = [
    { title:'Precision Matching', text:'Structured academic metadata surfaces roles aligned with your expertise.', icon:'🎯' },
    { title:'Institution Profiles', text:'Transparent university & school profiles build trust early.', icon:'🏫' },
    { title:'Draft & Publish Flow', text:'Employers stage perfect postings before going live.', icon:'📝' },
    { title:'Real-Time Expansion', text:'Architecture ready for messaging & application analytics.', icon:'⚡' }
  ];
  const steps = [
    { n:1, title:'Create Profile', text:'Highlight subjects, credentials & achievements.' },
    { n:2, title:'Explore Roles', text:'Filter by subject, institution type, & location.' },
    { n:3, title:'Apply & Track', text:'Stay informed as your applications progress.' },
    { n:4, title:'Grow Career', text:'Leverage insights to refine and advance.' }
  ];
  const jobCategories = ['Coaching','School','Pre-School','EdTech','College/University','Vocational Training Institute'];
  const jobLocations = ['Chennai','Kolkata','Hyderabad','Ahmedabad','Mumbai','Jaipur','Bangalore','Pune','Delhi','Indore','Bhubaneswar','Coimbatore','Patna','Agra','Lucknow'];
  const jobDesignations = ['Teacher Jobs','Biology Teacher Jobs','Science Teacher Jobs','Hindi Teacher Jobs','Social Science Teacher Jobs','Physics Teacher Jobs','Chemistry Teacher Jobs','Assistant Teacher Jobs','Computer Science Teacher Jobs','Economics Teacher Jobs','Accountancy Teacher Jobs','Academic Coordinator Jobs','English Language Teacher Jobs','General Teacher Jobs','Geography Teacher Jobs','Academic Counsellor Jobs','Accountant Jobs','Administration Executive Jobs'];

  function Marquee({ items, param, reverse=false, speed=25 }) {
    const content = [...items, ...items];
    const style = { animationDuration: speed + 's', animationDirection: reverse ? 'reverse' : 'normal' };
    return (
      <div className="marquee-wrap">
        <div className="marquee-track" style={style}>
          {content.map((it,i)=>(
            <button key={i+it+param+(reverse?'r':'n')} className="pill" onClick={()=>nav('/jobs?'+param+'='+encodeURIComponent(it.replace(/ Jobs$/,'').replace(/ Teacher Jobs$/,'').replace(/ Jobs$/,'').replace(/ /g,' ')))}>{it}</button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="home-root fade-in">
      <header className="home-hero">
        <div className="hero-bg-layers" />
        <div className="hero-inner">
          <div className="hero-pre">Academic Talent Marketplace</div>
          <h1>Discover & Advance Your Teaching Career</h1>
          <p className="hero-sub">Curated opportunities across universities, schools & institutes—powered by structured academic data for precise matching.</p>
          <form onSubmit={onSearch} className="hero-search">
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search subjects, titles, institutions" />
            <div className="sep" />
            <input value={city} onChange={e=>setCity(e.target.value)} placeholder="City or remote" />
            <button className="btn">Search</button>
          </form>
          <div className="hero-stats">
            {stats.map(s => (
              <div key={s.label} className="hero-stat">
                <div className="val">{s.value}</div>
                <div className="lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>
  {/* Redesigned Categories Section (Flat) */}
  <section className="home-section cat-modern flat-block">
        <div className="cat-head">
          <div className="cat-titles">
            <h2>Explore Academic Domains</h2>
            <p>Navigate structured knowledge areas & supporting functions with precision.</p>
          </div>
        </div>
        <div className="cat-showcase">
          {categories.map((c,i) => (
            <button
              key={c.name}
              className="cat-tile"
              style={{'--d': i}}
              onClick={()=>nav('/jobs?q='+encodeURIComponent(c.name))}
            >
              <span className="cat-glow" />
              <span className="cat-icon" aria-hidden><CatIcon type={c.icon} /></span>
              <span className="cat-meta">
                <span className="cat-name">{c.name}</span>
                <span className="cat-link">Browse roles</span>
              </span>
            </button>
          ))}
        </div>
      </section>
  {/* Redesigned Advantages Section (Flat) */}
  <section className="home-section advantages-modern flat-block">
        <div className="adv-head">
          <div>
            <h2>Platform Advantages</h2>
            <p>Engineered for academic hiring velocity & clarity.</p>
          </div>
          <div className="adv-accent" aria-hidden>
            <div className="orb orb-a" />
            <div className="orb orb-b" />
          </div>
        </div>
        <div className="adv-grid">
          {features.map((f,i) => (
            <div key={f.title} className="adv-card" style={{'--i': i}}>
              <div className="adv-ring" />
              <div className="adv-ic">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
              <span className="adv-line" />
            </div>
          ))}
        </div>
      </section>
      {/* Flat How It Works */}
      <section className="how-flat">
        <div className="how-head">
          <h2>How It Works</h2>
          <p>Focused, transparent steps from sign-up to long‑term growth.</p>
        </div>
        <div className="how-flow">
          {steps.map(s => (
            <div key={s.n} className="how-node" style={{'--i': s.n}}>
              <div className="how-core">{s.n}</div>
              <div className="how-meta">
                <div className="how-title">{s.title}</div>
                <div className="how-desc">{s.text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="home-section jobs-groups">
        <h2 style={{ textAlign:'center', marginBottom:'.75rem', marginTop:0 }}>Jobs by Categories</h2>
        <div className="pill-row center-wrap">
          {jobCategories.map(c => <button key={c} className="pill" onClick={()=>nav('/jobs?q='+encodeURIComponent(c))}>{c}</button>)}
        </div>
        <h2 style={{ textAlign:'center', margin:'1.3rem 0 .6rem' }}>Jobs by Locations</h2>
        <div style={{display:'flex',flexDirection:'column',gap:'.55rem'}}>
          <Marquee items={jobLocations.slice(0, Math.ceil(jobLocations.length/2)).map(l=>`Teacher jobs in ${l}`)} param="city" speed={22} />
          <Marquee items={jobLocations.slice(Math.ceil(jobLocations.length/2)).map(l=>`Teacher jobs in ${l}`)} param="city" reverse speed={24} />
        </div>
        <h2 style={{ textAlign:'center', margin:'1.3rem 0 .6rem' }}>Jobs by Designations</h2>
        <div style={{display:'flex',flexDirection:'column',gap:'.55rem'}}>
          <Marquee items={jobDesignations.slice(0, Math.ceil(jobDesignations.length/2))} param="q" speed={26} />
            <Marquee items={jobDesignations.slice(Math.ceil(jobDesignations.length/2))} param="q" reverse speed={28} />
        </div>
      </section>
      <section className="home-cta">
        <div className="cta-inner">
          <h2>Join the Academic Hiring Evolution</h2>
            <p>Be an early participant in a platform purpose-built for educators and institutions.</p>
          <div className="cta-actions">
            <Link to="/signup" className="btn btn-lg">Create Account</Link>
            <Link to="/post-job" className="btn-outline btn-lg">Post a Job</Link>
          </div>
        </div>
      </section>
      <div className="social-bar">
        <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter" className="soc soc-tw">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 5.8c-.7.3-1.4.5-2.2.6A3.6 3.6 0 0 0 21.4 4a7.2 7.2 0 0 1-2.3.9 3.6 3.6 0 0 0-6.2 3.3A10.2 10.2 0 0 1 3.2 4.7a3.6 3.6 0 0 0 1.1 4.8 3.6 3.6 0 0 1-1.6-.5v.1a3.6 3.6 0 0 0 2.9 3.5 3.7 3.7 0 0 1-1.6.1 3.6 3.6 0 0 0 3.3 2.4A7.3 7.3 0 0 1 2 18.2 10.2 10.2 0 0 0 7.6 20c6.8 0 10.6-5.7 10.6-10.6v-.5A7.6 7.6 0 0 0 22 5.8Z" /></svg>
        </a>
        <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="soc soc-in">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 0 0 5.001 2.5 2.5 0 0 0 0-5ZM3 9h4v12H3zM14.75 9c-2.14 0-3.25 1.17-3.75 2v-2H7v12h4v-6.5s0-2.5 2.25-2.5c1.5 0 1.5 1.75 1.5 2.6V21h4v-7c0-3.5-1.75-5-4-5Z" /></svg>
        </a>
        <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub" className="soc soc-gh">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77 5.44 5.44 0 0 0 3.5 8.5c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>
        </a>
        <a href="mailto:hello@example.com" aria-label="Email" className="soc soc-em">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z"/><path d="m22 6-10 7L2 6"/></svg>
        </a>
      </div>
      <footer className="site-footer">© {new Date().getFullYear()} JobPortal • Empowering educators & institutions.</footer>
    </div>
  );
}
