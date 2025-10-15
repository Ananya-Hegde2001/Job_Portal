import { Link, useNavigate } from 'react-router-dom';
import React from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../components/ui/Modal.jsx';
import { showToast } from '../util/toast.js';
import { api } from '../util/api.js';

export default function Home(){
  const { t } = useTranslation();
  const nav = useNavigate();
  const [q,setQ] = React.useState('');
  const [city,setCity] = React.useState('');
  function onSearch(e){ e.preventDefault(); const p=new URLSearchParams(); if(q) p.set('q', q); if(city) p.set('city', city); nav('/jobs?'+p.toString()); }
  // Stats with numeric targets for animation
  const stats = [
    { label:t('home.stats.activeJobs'), end:2400, type:'plus' },
    { label:t('home.stats.universities'), end:1100, type:'plus' },
    { label:t('home.stats.educators'), end:18000, type:'plus' },
    { label:t('home.stats.matchRate'), end:94, type:'percent' }
  ];

  function AnimatedStat({ end, type, label, duration=1400 }) {
    const [display,setDisplay] = React.useState('0');
    React.useEffect(()=>{
      // Reduced motion: jump straight to final
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
        if(type==='plus') setDisplay(end + '+');
        else if(type==='percent') setDisplay(end+'%');
        else setDisplay(end.toString());
        return;
      }
      let frame; const start = performance.now();
      function format(current){
        if(type==='plus') {
          const val = Math.min(Math.round(current), end);
          return val >= end ? end + '+' : val.toString();
        } else if(type==='percent') {
          return Math.min(Math.round(current), end) + '%';
        }
        return Math.round(current).toString();
      }
      function tick(now){
        const elapsed = now - start;
        const p = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1-p,3);
        const current = end * eased;
        setDisplay(format(current));
        if(p < 1) frame = requestAnimationFrame(tick); else setDisplay(format(end));
      }
      frame = requestAnimationFrame(tick);
      return ()=> cancelAnimationFrame(frame);
    }, [end, type, duration]);
    return (
      <div className="hero-stat">
        <div className="val" aria-label={label+': '+display}>{display}</div>
        <div className="lbl">{label}</div>
      </div>
    );
  }
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
  const steps = [
    { n:1, title:t('home.steps.1t'), text:t('home.steps.1d') },
    { n:2, title:t('home.steps.2t'), text:t('home.steps.2d') },
    { n:3, title:t('home.steps.3t'), text:t('home.steps.3d') },
    { n:4, title:t('home.steps.4t'), text:t('home.steps.4d') }
  ];
  const jobCategories = ['Coaching','School','Pre-School','EdTech','College/University','Vocational Training Institute'];
  const jobLocations = ['Chennai','Kolkata','Hyderabad','Ahmedabad','Mumbai','Jaipur','Bangalore','Pune','Delhi','Indore','Bhubaneswar','Coimbatore','Patna','Agra','Lucknow'];
  const jobDesignations = ['Teacher Jobs','Biology Teacher Jobs','Science Teacher Jobs','Hindi Teacher Jobs','Social Science Teacher Jobs','Physics Teacher Jobs','Chemistry Teacher Jobs','Assistant Teacher Jobs','Computer Science Teacher Jobs','Economics Teacher Jobs','Accountancy Teacher Jobs','Academic Coordinator Jobs','English Language Teacher Jobs','General Teacher Jobs','Geography Teacher Jobs','Academic Counsellor Jobs','Accountant Jobs','Administration Executive Jobs'];
  // Pricing / Upgrade state
  const [upgradeOpen,setUpgradeOpen] = React.useState(false);
  const [selectedPlan,setSelectedPlan] = React.useState('pro');
  const [billingCycle,setBillingCycle] = React.useState('monthly'); // monthly | yearly | lifetime
  const [checkingOut, setCheckingOut] = React.useState(false);

  const billingOptions = [
    { id:'monthly', label:'Monthly', note:'Billed monthly • Cancel anytime', price:999, suffix:'/mo' },
    { id:'yearly', label:'Yearly', note:'Billed annually • Cancel anytime', price:799, suffix:'/mo', subNote:'Equivalent per month (₹9,588 billed yearly)', highlight:true },
    { id:'lifetime', label:'Lifetime', note:'One-time payment • Lifetime access', price:14999, suffix:' one-time', oneTime:true }
  ];

  const coreFeatures = [
    'Unlimited job applications (teachers)',
    'AI-assisted candidate matching (employers)',
    'Advanced salary intelligence & benchmarking',
    'Institution review insights & sentiment summaries',
    'Priority job listing exposure (employers)',
    'Automated applicant screening rules',
    'Candidate shortlists & CSV export',
    'Team seats (up to 5 recruiters)',
    'Real-time application status analytics',
    'Email & in-app notifications',
    'API access (beta)',
    'Priority support SLA'
  ];

  async function loadRazorpay(){
    if (window.Razorpay) return true;
    return new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  }

  async function handleUpgrade(){
    if(!selectedPlan){ showToast('Select a plan first','error'); return; }
    setCheckingOut(true);
    try{
      const chosen = billingOptions.find(b=>b.id===billingCycle);
      if(!chosen){ throw new Error('Invalid billing option'); }
      const ok = await loadRazorpay();
      if(!ok){ showToast('Failed to load Razorpay','error'); return; }
      const amountPaise = (chosen.price) * 100; // INR -> paise
      const { order, key } = await api.createOrder(amountPaise, { receipt: `plan_${selectedPlan}_${billingCycle}_${Date.now()}` });
      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: 'Teacher Job Portal',
        description: `${selectedPlan.toUpperCase()} • ${billingCycle}`,
        order_id: order.id,
        handler: async function (response){
          try{
            const verify = await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            if (verify.ok){
              showToast('Payment successful! Plan activated.','success');
              setUpgradeOpen(false);
            } else {
              showToast('Payment verification failed.','error');
            }
          }catch(e){
            showToast('Verification error: '+(e?.message||'error'),'error');
          }
        },
        prefill: {},
        theme: { color: '#2563eb' }
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp){
        showToast(resp?.error?.description || 'Payment failed','error');
      });
      rzp.open();
    } catch(e){
      showToast(e?.message || 'Checkout error','error');
    } finally{
      setCheckingOut(false);
    }
  }

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
          <div className="hero-pre">{t('home.pre')}</div>
          <h1 className="shiny-text" data-animate-shine>{t('home.title')}</h1>
          <p className="hero-sub">{t('home.sub')}</p>
          <form onSubmit={onSearch} className="hero-search">
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder={t('home.searchWhat')} />
            <div className="sep" />
            <input value={city} onChange={e=>setCity(e.target.value)} placeholder={t('home.searchWhere')} />
            <button className="btn">{t('home.search')}</button>
          </form>
          <div className="hero-stats">
            {stats.map(s => (
              <AnimatedStat key={s.label} end={s.end} type={s.type} label={s.label} />
            ))}
          </div>
        </div>
      </header>
  {/* Redesigned Categories Section (Flat) */}
  <section className="home-section cat-modern flat-block">
        <div className="cat-head">
          <div className="cat-titles">
            <h2>{t('home.exploreDomains')}</h2>
            <p>{t('home.exploreDesc')}</p>
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
                <span className="cat-link">{t('home.browseRoles')}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
      {/* Flat How It Works */}
      <section className="how-flat">
        <div className="how-head">
          <h2>{t('home.how')}</h2>
          <p>{t('home.howDesc')}</p>
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
  <h2 style={{ textAlign:'center', marginBottom:'.75rem', marginTop:0 }}>{t('home.jobsByCategories')}</h2>
        <div className="pill-row center-wrap">
          {jobCategories.map(c => <button key={c} className="pill" onClick={()=>nav('/jobs?q='+encodeURIComponent(c))}>{c}</button>)}
        </div>
  <h2 style={{ textAlign:'center', margin:'1.3rem 0 .6rem' }}>{t('home.jobsByLocations')}</h2>
        <div style={{display:'flex',flexDirection:'column',gap:'.55rem'}}>
          <Marquee items={jobLocations.slice(0, Math.ceil(jobLocations.length/2)).map(l=>`Teacher jobs in ${l}`)} param="city" speed={22} />
          <Marquee items={jobLocations.slice(Math.ceil(jobLocations.length/2)).map(l=>`Teacher jobs in ${l}`)} param="city" reverse speed={24} />
        </div>
  <h2 style={{ textAlign:'center', margin:'1.3rem 0 .6rem' }}>{t('home.jobsByDesignations')}</h2>
        <div style={{display:'flex',flexDirection:'column',gap:'.55rem'}}>
          <Marquee items={jobDesignations.slice(0, Math.ceil(jobDesignations.length/2))} param="q" speed={26} />
            <Marquee items={jobDesignations.slice(Math.ceil(jobDesignations.length/2))} param="q" reverse speed={28} />
        </div>
      </section>
      <section className="home-cta">
        <div className="cta-inner">
          <h2>{t('home.ctaTitle')}</h2>
            <p>{t('home.ctaSub')}</p>
          <div className="cta-actions">
            <Link to="/signup" className="btn btn-lg">{t('home.ctaCreate')}</Link>
            <Link to="/post-job" className="btn-outline btn-lg">{t('home.ctaPost')}</Link>
          </div>
        </div>
      </section>
      {/* Pricing Section */}
      <section className="home-pricing">
        <div className="pricing-wrap">
          {/* Decorative meteor effect (non-essential visual) */}
          <div className="pricing-meteors" aria-hidden="true">
            <span className="meteor" />
            <span className="meteor" />
            <span className="meteor" />
            <span className="meteor" />
            <span className="meteor" />
            <span className="meteor" />
            <span className="meteor" />
            <span className="meteor" />
            <span className="meteor" />
            <span className="meteor" />
            <span className="meteor" />
            <span className="meteor" />
            {/* Added extra meteors for richer effect */}
            <span className="meteor alt" />
            <span className="meteor" />
            <span className="meteor alt" />
            <span className="meteor" />
            <span className="meteor alt" />
            <span className="meteor" />
            <span className="meteor alt" />
            <span className="meteor" />
            <span className="meteor alt" />
            <span className="meteor" />
          </div>
          <div className="pricing-head">
            <h2>Simple, transparent pricing</h2>
            <p>Flexible billing built for educators, recruiters, and growing institutions. Upgrade anytime—no hidden fees.</p>
          </div>
          <div className="pricing-grid">
            <div className="pricing-left">
              <div className="billing-options">
                {/* Current (Free) plan - non interactive */}
                <button type="button" className="billing-card disabled current-plan" aria-disabled="true">
                  <div className="bill-top">
                    <div className="bill-label">Free</div>
                    <div className="bill-price">₹0 <span className="bill-suffix">/mo</span></div>
                  </div>
                  <div className="bill-note">Your current plan</div>
                  <div className="bill-sub">Basic access for teachers & single employer usage.</div>
                </button>
                {billingOptions.map(opt => (
                  <button key={opt.id} onClick={()=>setBillingCycle(opt.id)} className={`billing-card ${billingCycle===opt.id?'active':''} ${opt.highlight?'highlight':''}`} aria-pressed={billingCycle===opt.id}>
                    <div className="bill-top">
                      <div className="bill-label">{opt.label}</div>
                      <div className="bill-price">₹{opt.price.toLocaleString()} <span className="bill-suffix">{opt.suffix}</span></div>
                    </div>
                    <div className="bill-note">{opt.note}</div>
                    {opt.subNote && <div className="bill-sub">{opt.subNote}</div>}
                  </button>
                ))}
              </div>
            </div>
            <div className="pricing-right">
              <div className="pricing-plan-box">
                <div className="plan-price-big">₹{billingOptions.find(b=>b.id===billingCycle).price.toLocaleString()} <span className="plan-price-cycle">{billingOptions.find(b=>b.id===billingCycle).suffix}</span></div>
                <div className="plan-cycle-note">{billingOptions.find(b=>b.id===billingCycle).note}</div>
                <ul className="feature-list">
                  {coreFeatures.map(f => <li key={f}>{f}</li>)}
                </ul>
                <button className="btn btn-lg pricing-cta" onClick={()=>setUpgradeOpen(true)}>Upgrade Now</button>
                <div className="pricing-fine">All prices in INR. Taxes may apply. Lifetime includes future feature releases (excludes 3rd-party paid add-ons).</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="home-section">
        <div className="help-cta">
          <div className="help-left">
            <span className="help-icon" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4"/><line x1="12" y1="17.5" x2="12" y2="17.51"/></svg>
            </span>
            <div>
              <h3 className="help-title">{t('home.helpTitle')}</h3>
              <p className="help-sub">{t('home.helpSub')}</p>
            </div>
          </div>
          <Link to="/help" className="btn">{t('home.helpOpen')}</Link>
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
  <footer className="site-footer">{t('home.footer', { year: new Date().getFullYear() })}</footer>
  <Modal
    open={upgradeOpen}
    title="Confirm plan upgrade"
    onClose={()=>setUpgradeOpen(false)}
    onSubmit={handleUpgrade}
    primaryLabel="Confirm Upgrade"
    secondaryLabel="Cancel"
    width={620}
  >
    <div style={{display:'grid',gap:'.9rem'}}>
      <div style={{fontSize:'.7rem',letterSpacing:'.5px',fontWeight:600,color:'var(--color-text-dim)'}}>CHOOSE PLAN</div>
      <div className="plan-grid">
        {['basic','pro','team'].map(p => (
          <label key={p} className={`plan-card ${selectedPlan===p?'active':''}`} style={{cursor:'pointer'}}>
            <input type="radio" name="plan" value={p} checked={selectedPlan===p} onChange={()=>setSelectedPlan(p)} style={{position:'absolute',opacity:0}} />
            <div className="plan-name" style={{fontWeight:700,textTransform:'uppercase',fontSize:'.7rem',letterSpacing:'.8px'}}>{p}</div>
            <div className="plan-desc" style={{fontSize:'.6rem',color:'var(--color-text-dim)'}}>
              {p==='basic' && 'Starter essentials'}
              {p==='pro' && 'Advanced visibility & analytics'}
              {p==='team' && 'Scaling hiring collaboration'}
            </div>
          </label>
        ))}
      </div>
      <p style={{fontSize:'.6rem',margin:'0',color:'var(--color-text-dim)'}}>Payments powered by Razorpay Test Mode. Use test cards or UPI. </p>
      {checkingOut && <p className="muted" style={{margin:0}}>Processing checkout…</p>}
    </div>
  </Modal>
    </div>
  );
}
