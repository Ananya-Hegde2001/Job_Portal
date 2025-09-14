import { useState } from 'react';
import AuthModal from '../components/AuthModal.jsx';
import { api } from '../util/api.js';
import { showToast } from '../util/toast.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [error, setError] = useState(null);

  function submit(e) {
    e.preventDefault();
    setLoading(true); setError(null); setTokenInfo(null);
    api.post('/auth/forgot', { email: email.trim() })
      .then(r => {
        showToast('If account exists, token generated','success');
        if (r.token) setTokenInfo({ token: r.token, expires: r.expires });
      })
      .catch(err => { setError(err.message || 'Request failed'); })
      .finally(()=> setLoading(false));
  }

  return (
    <AuthModal title="Forgot Password" subtitle="Enter your account email to generate a reset token.">
      <form onSubmit={submit} noValidate>
        {error && <div style={{color:'var(--color-danger)',fontSize:'.65rem',fontWeight:600,letterSpacing:'.5px',marginBottom:'.4rem'}}>{error}</div>}
        <div>
          <label>Email</label>
          <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <button className="btn" disabled={loading}>{loading ? 'Requesting…' : 'Generate Token'}</button>
        {tokenInfo && (
          <div style={{ marginTop:'1rem', fontSize:'.6rem', lineHeight:1.4 }}>
            <div style={{ fontWeight:600, letterSpacing:'.6px', marginBottom:'.25rem' }}>Temporary Token (auto-filled if you click Reset Now):</div>
            <code style={{ wordBreak:'break-all', display:'block', background:'var(--color-surface-alt)', padding:'.5rem .6rem', borderRadius:'.4rem', fontSize:'.55rem', border:'1px solid var(--color-border)' }}>{tokenInfo.token}</code>
            <div style={{ opacity:.7, marginTop:'.4rem' }}>Expires in 15 minutes.</div>
            <div style={{ marginTop:'.6rem', display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
              <a className="btn btn-secondary" href={`/reset?token=${tokenInfo.token}`}>Reset Now</a>
            </div>
          </div>
        )}
      </form>
    </AuthModal>
  );
}
