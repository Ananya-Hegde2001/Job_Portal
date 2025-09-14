import { useState, useEffect } from 'react';
import AuthModal from '../components/AuthModal.jsx';
import { api } from '../util/api.js';
import PasswordInput from '../components/PasswordInput.jsx';
import { showToast } from '../util/toast.js';

export default function ResetPassword() {
  const [token, setToken] = useState('');
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('token');
      if (t) setToken(t);
    } catch (_) {}
  }, []);

  function submit(e) {
    e.preventDefault();
    setError(null);
    if (pw1.length < 6) { setError('Password too short'); return; }
    if (pw1 !== pw2) { setError('Passwords do not match'); return; }
    setLoading(true);
    api.post('/auth/reset', { token: token.trim(), password: pw1 })
      .then(() => { showToast('Password reset','success'); setDone(true); })
      .catch(err => setError(err.message || 'Reset failed'))
      .finally(()=> setLoading(false));
  }

  return (
    <AuthModal title="Reset Password" subtitle="Use the token you received to set a new password.">
      <form onSubmit={submit} noValidate>
        {error && <div style={{color:'var(--color-danger)',fontSize:'.65rem',fontWeight:600,letterSpacing:'.5px',marginBottom:'.5rem'}}>{error}</div>}
        <div>
          <label>Reset Token</label>
          <textarea required rows={2} value={token} onChange={e=>setToken(e.target.value)} placeholder="Paste token here" style={{ resize:'vertical' }} />
        </div>
        <div>
          <label>New Password</label>
          <PasswordInput value={pw1} onChange={e=>setPw1(e.target.value)} required minLength={6} placeholder="New password" showStrength autoComplete="new-password" />
        </div>
        <div>
          <label>Confirm Password</label>
          <PasswordInput value={pw2} onChange={e=>setPw2(e.target.value)} required minLength={6} placeholder="Repeat new password" autoComplete="new-password" />
        </div>
        <button className="btn" disabled={loading || done}>{done ? 'Done' : (loading ? 'Resetting…' : 'Reset Password')}</button>
        {done && <div style={{ fontSize:'.6rem', marginTop:'.7rem', fontWeight:600, letterSpacing:'.5px', color:'var(--color-success)' }}>Password updated. You may close this window and sign in.</div>}
      </form>
    </AuthModal>
  );
}
