import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import AuthModal from '../components/AuthModal.jsx';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [role, setRole] = useState('teacher');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function onChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }
  function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    login(form.email.trim(), form.password)
      .then(() => nav('/'))
      .catch(err => setError(err.message || 'Login failed'))
      .finally(() => setLoading(false));
  }

  return (
    <AuthModal
      title="Welcome Back"
      subtitle="Sign in to continue your teaching journey." >
      <form onSubmit={onSubmit} noValidate>
        {error && <div style={{color:'var(--color-danger)',fontSize:'0.72rem',fontWeight:600,letterSpacing:'.5px'}}>{error}</div>}
        <div>
          <label style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>Role</span>
            <span style={{ fontSize:'.55rem', letterSpacing:'.8px', fontWeight:600, opacity:.6 }}>{role}</span>
          </label>
          <div className="seg-toggle alt" style={{ width:'100%' }}>
            <div
              className="seg-thumb"
              style={{ left: role === 'teacher' ? '3px' : 'calc(50% + 3px)', width:'calc(50% - 6px)' }}
            />
            <button type="button" className={role==='teacher'?'active':''} onClick={()=>setRole('teacher')}>Teacher</button>
            <button type="button" className={role==='employer'?'active':''} onClick={()=>setRole('employer')}>Employer</button>
          </div>
        </div>
        <div>
          <label>Email</label>
          <input autoFocus name="email" type="email" placeholder="you@example.com" value={form.email} onChange={onChange} required />
        </div>
        <div>
          <label>Password</label>
          <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={onChange} required />
        </div>
        <button className="btn" disabled={loading}>{loading ? 'Signing In…' : 'Sign In'}</button>
        <div className="auth-alt">New here? <Link to="/signup" state={{ background: { pathname: '/' } }}>Create an account</Link></div>
      </form>
    </AuthModal>
  );
}
