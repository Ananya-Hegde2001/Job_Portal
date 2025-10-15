import React from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Home from './pages/Home.jsx';
import AIChat from './pages/AIChat.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import About from './pages/About.jsx';
import DashboardTeacher from './pages/DashboardTeacher.jsx';
import HelpCenter from './pages/HelpCenter.jsx';
import Institutions from './pages/Institutions.jsx';
import SalaryGuide from './pages/SalaryGuide.jsx';
import SalaryDetail from './pages/SalaryDetail.jsx';
import DashboardEmployer from './pages/DashboardEmployer.jsx';
import Admin from './pages/Admin.jsx';
import JobList from './pages/JobList.jsx';
import JobDetail from './pages/JobDetail.jsx';
import PostJob from './pages/PostJob.jsx';
import Profile from './pages/Profile.jsx';
import JobAlerts from './pages/JobAlerts.jsx';
import { useAuth } from './state/AuthContext.jsx';
import LanguageSelect from './components/LanguageSelect.jsx';
import FloatingFeedback from './components/FloatingFeedback.jsx';

function Nav() {
  const { user, logout } = useAuth();
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef(null); // wrapper for button + dropdown
  const [theme, setTheme] = React.useState(()=>{
    if (typeof window === 'undefined') return 'dark';
    return localStorage.getItem('jp-theme') || 'dark';
  });
  React.useEffect(()=>{
    // apply theme attribute
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('jp-theme', theme);
    // if we are in a switching state, remove the no-transition flag next frame
    if (document.documentElement.classList.contains('theme-switching')) {
      requestAnimationFrame(()=>{
        document.documentElement.classList.remove('theme-switching');
      });
    }
  },[theme]);
  const toggleTheme = () => {
    const doc = document.documentElement;
    // add class to suppress transitions only for the switch
    doc.classList.add('theme-switching');
    setTheme(t=> t === 'dark' ? 'light' : 'dark');
  };
  const location = useLocation();
  const { t } = useTranslation();
  function toggleMenu() { setOpen(o=>!o); }
  const active = (path) => location.pathname === path ? 'active' : undefined;
  const isLight = theme === 'light';

  // Close menu on route change
  React.useEffect(()=>{ setOpen(false); }, [location.pathname]);

  // Close on outside click / touch or Escape
  React.useEffect(()=>{
    if(!open) return; // only attach when open
    function handlePointer(e){
      if(menuRef.current && !menuRef.current.contains(e.target)){
        setOpen(false);
      }
    }
    function handleKey(e){ if(e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('touchstart', handlePointer, { passive:true });
    document.addEventListener('keydown', handleKey);
    return ()=>{
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('touchstart', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);
  return (
    <div className="navbar">
      <div className="navbar-inner">
  <Link className="brand" to="/" style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
    <span style={{ display:'inline-flex', width:30, height:30, borderRadius:10, background:'#2563eb', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 5px -2px rgba(0,0,0,.45)' }}>
      <svg width="15" height="15" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill="white" d="M30 78V42l30-12 30 12v36l-30 12-30-12Zm30-24 26.4-10.56L60 33 33.6 43.44 60 54Zm0 5.52L36 50.16v23.28L60 83l24-9.56V50.16L60 59.52Z" />
      </svg>
    </span>
    {t('brand')}
  </Link>
        <div className="nav-links">
          <Link className={active('/')} to="/">{t('nav.home')}</Link>
          {(!user || user.role !== 'employer') && <Link className={active('/jobs')} to="/jobs">{t('nav.findJobs')}</Link>}
          <Link className={active('/institutions')} to="/institutions">{t('nav.institutions')}</Link>
          <Link className={active('/salary')} to="/salary">{t('nav.salary')}</Link>
          <Link className={active('/help')} to="/help">{t('nav.help')}</Link>
          <Link className={active('/about')} to="/about">{t('nav.about')}</Link>
          <Link
            className={active('/ai-chat')}
            to="/ai-chat"
            title={user ? 'Open AI Chat Assistant' : 'Login required'}
            style={!user ? { position:'relative' } : undefined}
          >
            {t('nav.aiChat')}
            {!user && <span style={{marginLeft:4,fontSize:'10px',opacity:.6}}>🔒</span>}
          </Link>
          {user?.role === 'teacher' && <Link className={active('/alerts')} to="/alerts">Alerts</Link>}
          {user?.role === 'teacher' && <Link to="/dashboard/teacher">{t('nav.teacherDash')}</Link>}
          {user?.role === 'employer' && <Link to="/dashboard/employer">{t('nav.employerDash')}</Link>}
          {user?.role === 'admin' && <Link to="/admin">{t('nav.admin')}</Link>}
        </div>
        <div className="nav-spacer" />
        <div className="nav-links" style={{ gap: '1rem', alignItems:'center' }}>
          <button
            aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
            className="theme-toggle"
            data-mode={theme}
            onClick={toggleTheme}
            style={{ order: 10 }}
            title={isLight ? 'Dark mode' : 'Light mode'}
          >
            <span className="icon-wrap" aria-hidden>
              <svg className="icon-sun" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <svg className="icon-moon" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79Z" />
              </svg>
            </span>
            <span className="visually-hidden">{isLight ? 'Switch to dark theme' : 'Switch to light theme'}</span>
          </button>
          {user ? (
            <>
              <LanguageSelect />
              <div style={{ position:'relative' }} ref={menuRef}>
                <button onClick={toggleMenu} aria-haspopup="menu" aria-expanded={open} style={{
                  background:'var(--color-surface-alt)',
                  border:'1px solid var(--color-border)',
                  display:'flex',alignItems:'center',gap:'.55rem',
                  padding:'.4rem .65rem .4rem .5rem',
                  borderRadius:'999px',
                  cursor:'pointer',
                  fontSize:'.7rem',
                  fontWeight:600,
                  letterSpacing:'.5px',
                  color:'var(--color-text-dim)',
                  boxShadow:'var(--shadow-sm)',
                  transition:'var(--transition-fast)'
                }}
                  className="acct-chip"
                >
                  <span style={{
                    width:28,height:28,borderRadius:'50%',
                    background: user.role==='admin' ? 'linear-gradient(135deg,#f59e0b,#b45309)' : user.role==='employer' ? 'linear-gradient(135deg,#6366f1,#4338ca)' : 'linear-gradient(135deg,#14b8a6,#0d9488)',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:'12px',fontWeight:700,color:'#fff',
                    boxShadow:'0 0 0 1px rgba(255,255,255,.12),0 4px 10px -3px rgba(0,0,0,.55)'
                  }}>
                    {user.role==='admin' ? 'A' : user.role==='employer' ? 'E' : 'T'}
                  </span>
                  <span className="acct-name" style={{ maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user.name || 'Account'}</span>
                  <span style={{fontSize:10,opacity:.6,display:'flex',alignItems:'center',marginLeft:2}}>{open ? '▴' : '▾'}</span>
                </button>
                {open && (
                  <div style={{ position:'absolute', right:0, top:'110%', background:'var(--color-elevated-bg,linear-gradient(160deg,#1b2530,#141b23))', border:'1px solid var(--color-border)', borderRadius:'18px', padding:'.9rem 1rem 1rem', minWidth:250, boxShadow:'0 12px 40px -10px rgba(0,0,0,.25),0 0 0 1px rgba(0,0,0,.04)', display:'grid', gap:'.7rem', zIndex:80 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'.7rem' }}>
                      <div style={{
                        width:42,height:42,borderRadius:'14px',
                        background: user.role==='admin' ? 'linear-gradient(135deg,#f59e0b,#b45309)' : user.role==='employer' ? 'linear-gradient(135deg,#6366f1,#4338ca)' : 'linear-gradient(135deg,#14b8a6,#0d9488)',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontWeight:700,fontSize:'14px',color:'#fff',
                        boxShadow:'0 0 0 1px rgba(255,255,255,.18),0 6px 14px -4px rgba(0,0,0,.55)'
                      }}>
                        {user.role==='admin' ? 'A' : user.role==='employer' ? 'E' : 'T'}
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:'.25rem' }}>
                        <div style={{ fontWeight:600,fontSize:'.85rem',letterSpacing:'.3px' }}>{user.name}</div>
                        <div style={{ fontSize:'.6rem',letterSpacing:'.6px',fontWeight:600,textTransform:'uppercase',background:'var(--color-surface-alt)',padding:'.3rem .55rem',borderRadius:'999px',width:'fit-content',color:'var(--color-text-dim)',border:'1px solid var(--color-border)' }}>{user.role}</div>
                      </div>
                    </div>
                    <div style={{ height:1,background:'linear-gradient(90deg,transparent,var(--color-border),transparent)',margin:'.25rem 0 .2rem' }} />
                    <Link to="/profile" onClick={()=>setOpen(false)} className="btn-outline btn-sm" style={{ textAlign:'center' }}>Profile</Link>
                    <button
                      className="btn btn-sm"
                      onClick={()=>{ setOpen(false); logout(); }}
                      style={{
                        background:'#3b82f6',
                        borderColor:'#3b82f6',
                        color:'#fff',
                        '--btn-bg':'#3b82f6',
                        '--btn-bg-hover':'#2563eb',
                        textAlign:'center',
                        width:'100%',
                        justifyContent:'center'
                      }}
                    >Logout</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:'.75rem', paddingRight:'.25rem' }}>
              <Link to="/login" className="btn-outline btn-sm">{t('nav.signIn')}</Link>
              <Link to="/signup" className="btn btn-sm">{t('nav.register')}</Link>
              <LanguageSelect />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Protected({ roles, children }) {
  const { user, initializing } = useAuth();
  const location = useLocation();
  if (initializing) return null; // or a small loader component
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const location = useLocation();
  const state = location.state;
  const background = state && state.background;
  return (
    <div>
      <Nav />
      <div className="layout">
        <Routes location={background || location}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/institutions" element={<Institutions />} />
          <Route path="/salary" element={<SalaryGuide />} />
          <Route path="/salary/:slug" element={<SalaryDetail />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/jobs" element={<JobList />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/post-job" element={<Protected roles={['employer']}><PostJob /></Protected>} />
          <Route path="/profile" element={<Protected roles={['teacher','employer']}><Profile /></Protected>} />
          <Route path="/alerts" element={<Protected roles={['teacher']}><JobAlerts /></Protected>} />
          <Route path="/dashboard/teacher" element={<Protected roles={['teacher']}><DashboardTeacher /></Protected>} />
          <Route path="/dashboard/employer" element={<Protected roles={['employer']}><DashboardEmployer /></Protected>} />
          <Route path="/admin" element={<Protected roles={['admin']}><Admin /></Protected>} />
          <Route path="/ai-chat" element={<Protected roles={['teacher','employer','admin']}><div style={{padding:'1.5rem 1.2rem'}}><AIChat /></div></Protected>} />
        </Routes>
        {background && (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/reset" element={<ResetPassword />} />
          </Routes>
        )}
        {!background && (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/reset" element={<ResetPassword />} />
          </Routes>
        )}
      </div>
      <FloatingFeedback />
    </div>
  );
}
