import React from 'react';
import { api } from '../util/api.js';
import { sendFeedbackEmail, emailEnvReady, debugEmailConfig } from '../util/email.js';
import { useAuth } from '../state/AuthContext.jsx';

export default function FloatingFeedback(){
  const { user } = useAuth();
  const [open,setOpen] = React.useState(false);
  const [email,setEmail] = React.useState(user?.email || '');
  const [message,setMessage] = React.useState('');
  const [sending,setSending] = React.useState(false);
  const [status,setStatus] = React.useState(null);
  const formRef = React.useRef(null);

  React.useEffect(()=>{ if(user?.email && !email) setEmail(user.email); },[user,email]);
  React.useEffect(()=>{
    if (import.meta.env.DEV) {
      // One-time diagnostic
      console.debug('[feedback] email config', debugEmailConfig());
    }
  },[]);

  function toggle(){ setOpen(o=>!o); setStatus(null); }

  async function submit(e){
    e.preventDefault();
    if(!message.trim()) return;
    setSending(true); setStatus(null);
    try {
      const tasks = [];
      // Fire API storage (non-blocking if email also configured)
      tasks.push(api.submitFeedback(email.trim() || null, message.trim()).catch(()=>null));
      if(emailEnvReady()) {
        tasks.push(sendFeedbackEmail({ email: email.trim(), message: message.trim(), name: user?.name }));
      }
      await Promise.all(tasks);
      setStatus({ ok:true, msg: emailEnvReady() ? 'Sent! Check your inbox.' : 'Sent! Thank you.'});
      setMessage('');
      // close after short delay
      setTimeout(()=>{ setOpen(false); setStatus(null); }, 1400);
    } catch(err){
      setStatus({ ok:false, msg: err.message || 'Failed'});
    } finally { setSending(false); }
  }

  return (
    <div className="feedback-root" aria-live="polite">
      <button aria-label={open ? 'Hide feedback form' : 'Open feedback form'} onClick={toggle} className="feedback-toggle">
        <span className="icon" aria-hidden>
          <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </span>
      </button>
      {open && (
        <div className="feedback-panel" role="dialog" aria-modal="false" ref={formRef}>
          <div className="fb-head">
            <div className="fb-head-text">
              <h4 className="fb-title">Have a question? Drop in your message <span className="fb-emoji" role="img" aria-label="point down">👇</span></h4>
              <p className="fb-sub">It won't take more than 10 seconds. Shoot your shot. <span role="img" aria-label="smile">😁</span></p>
            </div>
            <button type="button" className="fb-close" aria-label="Close feedback form" onClick={()=>setOpen(false)}>
              <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <form onSubmit={submit} className="fb-form">
            <label className="fb-label">Email Address
              <input type="email" className="fb-input" placeholder="johndoe@xyz.com" value={email} onChange={e=>setEmail(e.target.value)} />
            </label>
            <label className="fb-label">Message
              <textarea className="fb-textarea" placeholder="I'd love a compliment from you." rows={5} value={message} onChange={e=>setMessage(e.target.value)} />
            </label>
            {status && <div className={`fb-status ${status.ok? 'ok':'err'}`}>{status.msg}</div>}
            <button className="fb-submit" disabled={sending || !message.trim()}>{sending? 'Sending...' : 'Submit'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
