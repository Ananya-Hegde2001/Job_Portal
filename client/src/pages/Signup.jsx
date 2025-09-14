import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import AuthModal from '../components/AuthModal.jsx';

export default function Signup() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'teacher' });
  const [showPw, setShowPw] = useState(false);
  const strength = useMemo(()=>{
    const pwd = form.password || '';
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    // cap
    if (score > 5) score = 5;
    const labels = ['Too Weak','Weak','Fair','Good','Strong','Excellent'];
    return { score, label: labels[score] };
  }, [form.password]);

  const strengthPercent = (strength.score/5)*100;
  const strengthColor = ['#ef4444','#f97316','#eab308','#22c55e','#16a34a','#0ea5e9'][strength.score];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function onChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }
  function onSubmit(e) {
    e.preventDefault();
    setLoading(true); setError(null);
    const payload = { ...form, email: form.email.trim() };
    register(payload)
      .then(() => nav('/'))
      .catch(err => setError(err.message || 'Registration failed'))
      .finally(() => setLoading(false));
  }

  return (
    <AuthModal
      title="Create Your Account"
      subtitle="Join as a teacher or employer and start exploring opportunities." >
      <form onSubmit={onSubmit} noValidate>
        {error && <div style={{color:'var(--color-danger)',fontSize:'0.72rem',fontWeight:600,letterSpacing:'.5px'}}>{error}</div>}
        <div>
          <label>Full Name</label>
          <input name="name" placeholder="Jane Doe" value={form.name} onChange={onChange} required />
        </div>
        <div>
          <label style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>Role</span>
            <span style={{ fontSize:'.55rem', letterSpacing:'.8px', fontWeight:600, opacity:.6 }}>{form.role}</span>
          </label>
          <div className="seg-toggle" style={{ width:'100%' }}>
            <div
              className="seg-thumb"
              style={{ left: form.role === 'teacher' ? '3px' : 'calc(50% + 3px)', width:'calc(50% - 6px)' }}
            />
            <button type="button" className={form.role==='teacher'?'active':''} onClick={()=>setForm(f=>({...f, role:'teacher'}))}>Teacher</button>
            <button type="button" className={form.role==='employer'?'active':''} onClick={()=>setForm(f=>({...f, role:'employer'}))}>Employer</button>
          </div>
        </div>
        <div>
          <label>Email</label>
          <input name="email" type="email" placeholder="you@school.org" value={form.email} onChange={onChange} required />
        </div>
        <div style={{ position:'relative' }}>
          <label>Password</label>
            <input
              name="password"
              type={showPw ? 'text':'password'}
              placeholder="Choose a strong password"
              value={form.password}
              onChange={onChange}
              required
              minLength={6}
              style={{ paddingRight:'3.2rem' }}
            />
            <button
              type="button"
              onClick={()=>setShowPw(s=>!s)}
              style={{ position:'absolute', top:'32px', right:'10px', background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.15)', color:'#cfd4df', fontSize:'.65rem', padding:'.45rem .55rem', borderRadius:'10px', cursor:'pointer', letterSpacing:'.5px', fontWeight:600 }}
            >{showPw ? 'HIDE' : 'SHOW'}</button>
            {form.password && (
              <div style={{ marginTop:'.55rem' }}>
                <div style={{ height:'6px', borderRadius:'6px', background:'rgba(255,255,255,.08)', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', inset:0, width: strengthPercent+'%', background: strengthColor, transition:'width .35s var(--ease), background .35s var(--ease)' }} />
                </div>
                <div style={{ fontSize:'.55rem', letterSpacing:'.8px', fontWeight:600, marginTop:'.4rem', textTransform:'uppercase', color: strengthColor }}>{strength.label}</div>
              </div>
            )}
        </div>
        <button className="btn" disabled={loading}>{loading ? 'Creating Account…' : 'Create Account'}</button>
        <div className="auth-alt">Already have an account? <Link to="/login" state={{ background: { pathname: '/' } }}>Sign in</Link></div>
      </form>
    </AuthModal>
  );
}
