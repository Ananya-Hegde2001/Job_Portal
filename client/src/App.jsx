import React from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import About from './pages/About.jsx';
import DashboardTeacher from './pages/DashboardTeacher.jsx';
import DashboardEmployer from './pages/DashboardEmployer.jsx';
import Admin from './pages/Admin.jsx';
import JobList from './pages/JobList.jsx';
import JobDetail from './pages/JobDetail.jsx';
import PostJob from './pages/PostJob.jsx';
import Profile from './pages/Profile.jsx';
import { useAuth } from './state/AuthContext.jsx';

function Nav() {
  const { user, logout } = useAuth();
  const [open, setOpen] = React.useState(false);
  const location = useLocation();
  function toggleMenu() { setOpen(o=>!o); }
  const active = (path) => location.pathname === path ? 'active' : undefined;
  return (
    <div className="navbar">
      <div className="navbar-inner">
  <Link className="brand" to="/" style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
    <span style={{ display:'inline-flex', width:30, height:30, borderRadius:10, background:'#2563eb', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 5px -2px rgba(0,0,0,.45)' }}>
      <svg width="15" height="15" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill="white" d="M30 78V42l30-12 30 12v36l-30 12-30-12Zm30-24 26.4-10.56L60 33 33.6 43.44 60 54Zm0 5.52L36 50.16v23.28L60 83l24-9.56V50.16L60 59.52Z" />
      </svg>
    </span>
    Teacher's JobPortal
  </Link>
        <div className="nav-links">
          <Link className={active('/')} to="/">Home</Link>
          {(!user || user.role !== 'employer') && <Link className={active('/jobs')} to="/jobs">Find Jobs</Link>}
          <Link className={active('/about')} to="/about">About</Link>
          {user?.role === 'teacher' && <Link to="/dashboard/teacher">Dashboard</Link>}
          {user?.role === 'employer' && <Link to="/dashboard/employer">Employer</Link>}
          {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
        </div>
        <div className="nav-spacer" />
        <div className="nav-links" style={{ gap: '1rem' }}>
          {user ? (
            <>
              {user.role === 'employer' && <Link className="btn btn-sm" to="/post-job">Post Job</Link>}
              {user.role === 'teacher' && <Link className="btn-outline btn-sm" to="/jobs">Search Jobs</Link>}
              <div style={{ position:'relative' }}>
                <button onClick={toggleMenu} style={{
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
                  <span style={{ maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'#e2e8f0' }}>{user.name || 'Account'}</span>
                  <span style={{fontSize:10,opacity:.6,display:'flex',alignItems:'center',marginLeft:2}}>{open ? '▴' : '▾'}</span>
                </button>
                {open && (
                  <div style={{ position:'absolute', right:0, top:'110%', background:'linear-gradient(160deg,#1b2530,#141b23)', border:'1px solid var(--color-border)', borderRadius:'18px', padding:'.9rem 1rem 1rem', minWidth:250, boxShadow:'0 12px 40px -10px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.05)', display:'grid', gap:'.7rem', zIndex:80 }}>
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
                    <button className="btn-outline btn-sm" onClick={()=>{ setOpen(false); logout(); }}>Logout</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:'.75rem', paddingRight:'.25rem' }}>
              <Link to="/login" className="btn-outline btn-sm">Sign In</Link>
              <Link to="/signup" className="btn btn-sm">Register</Link>
              <Link to="/post-job" className="btn-outline btn-sm">Post Job</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Protected({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
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
          <Route path="/jobs" element={<JobList />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/post-job" element={<Protected roles={['employer']}><PostJob /></Protected>} />
          <Route path="/profile" element={<Protected roles={['teacher','employer']}><Profile /></Protected>} />
          <Route path="/dashboard/teacher" element={<Protected roles={['teacher']}><DashboardTeacher /></Protected>} />
          <Route path="/dashboard/employer" element={<Protected roles={['employer']}><DashboardEmployer /></Protected>} />
          <Route path="/admin" element={<Protected roles={['admin']}><Admin /></Protected>} />
        </Routes>
        {background && (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        )}
        {!background && (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        )}
      </div>
    </div>
  );
}
