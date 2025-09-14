import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import AuthModal from '../components/AuthModal.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

export default function Signup() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'teacher', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function onChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }
  function onSubmit(e) {
    e.preventDefault();
    setLoading(true); setError(null);
    const payload = { ...form, email: form.email.trim() };
      if (!/^\d{10}$/.test(payload.phone || '')) { setLoading(false); setError('Invalid phone number'); return; }
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
        {error && <div style={{color:'var(--color-danger)',fontSize:'0.72rem',fontWeight:600,letterSpacing:'.5px',marginBottom:'.4rem'}}>{error}</div>}
        <div style={{ display:'grid', gap:'.85rem', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', marginBottom:'.25rem' }}>
          <div>
            <label style={{display:'block'}}>Full Name</label>
            <input name="name" placeholder="Jane Doe" value={form.name} onChange={onChange} required />
          </div>
          <div>
            <label style={{display:'block'}}>Email</label>
            <input name="email" type="email" placeholder="you@school.org" value={form.email} onChange={onChange} required />
          </div>
          <div>
            <label style={{display:'block'}}>Phone</label>
            <input name="phone" placeholder="9876543210" value={form.phone} onChange={onChange} required pattern="^\\d{10}$" maxLength={10} />
            {form.phone && !/^\d{10}$/.test(form.phone) && (
              <div style={{ color:'var(--color-danger)', fontSize:'.52rem', marginTop:'.2rem', fontWeight:600, letterSpacing:'.5px' }}>Invalid</div>
            )}
          </div>
        </div>
        <div style={{ marginBottom:'.65rem' }}>
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
        <div style={{ marginBottom:'.9rem' }}>
          <label htmlFor="signup-password" style={{display:'block'}}>Password</label>
          <PasswordInput
            id="signup-password"
            value={form.password}
            onChange={onChange}
            required
            minLength={6}
            placeholder="Choose a strong password"
            showStrength
            autoComplete="new-password"
          />
        </div>
        <button className="btn" disabled={loading}>{loading ? 'Creating Account…' : 'Create Account'}</button>
        <div className="auth-alt">Already have an account? <Link to="/login" state={{ background: { pathname: '/' } }}>Sign in</Link></div>
      </form>
    </AuthModal>
  );
}
