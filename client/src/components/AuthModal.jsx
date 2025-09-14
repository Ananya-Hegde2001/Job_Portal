import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AuthModal({ title, subtitle, children }) {
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, []);

  function close() {
    const dest = loc.state && loc.state.background ? loc.state.background.pathname || '/' : '/';
    nav(dest, { replace: true });
  }

  return createPortal(
    <div className="auth-overlay" onMouseDown={close}>
      <div className="auth-dialog" onMouseDown={e => e.stopPropagation()}>
        <button className="auth-close" onClick={close} aria-label="Close authentication dialog">✕</button>
        <div className="auth-header">
          <h2>{title}</h2>
          {subtitle && <p className="muted small" style={{ marginTop: '.25rem' }}>{subtitle}</p>}
        </div>
        <div className="auth-body">
          {children}
        </div>
      </div>
    </div>, document.body);
}
