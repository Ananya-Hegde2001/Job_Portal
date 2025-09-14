import { useState, useMemo } from 'react';

export default function PasswordInput({
  id,
  name = 'password',
  value,
  onChange,
  placeholder = 'Password',
  required = false,
  minLength = 6,
  showStrength = false,
  disabled = false,
  autoComplete = 'current-password'
}) {
  const [show, setShow] = useState(false);

  const strength = useMemo(() => {
    if (!showStrength) return null;
    const pwd = value || '';
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score > 5) score = 5;
    const labels = ['Too Weak','Weak','Fair','Good','Strong','Excellent'];
    const colors = ['#ef4444','#f97316','#eab308','#22c55e','#16a34a','#0ea5e9'];
    return { score, label: labels[score], percent: (score/5)*100, color: colors[score] };
  }, [value, showStrength]);

  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        name={name}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        disabled={disabled}
        autoComplete={autoComplete}
        style={{ paddingRight: '3.2rem' }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', right:'10px', background:'rgba(59,130,246,.10)', border:'1px solid var(--color-primary-accent)', color:'var(--color-primary)', fontSize:'.60rem', padding:'.40rem .55rem', borderRadius:'10px', cursor:'pointer', letterSpacing:'.5px', fontWeight:600 }}
      >{show ? 'HIDE' : 'SHOW'}</button>
      {showStrength && value && strength && (
        <div style={{ marginTop:'.4rem' }}>
          <div style={{ height:'4px', borderRadius:'4px', background:'rgba(255,255,255,.08)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, width: strength.percent+'%', background: strength.color, transition:'width .3s var(--ease), background .3s var(--ease)' }} />
          </div>
          <div style={{ fontSize:'.5rem', letterSpacing:'.7px', fontWeight:600, marginTop:'.3rem', textTransform:'uppercase', color: strength.color }}>{strength.label}</div>
        </div>
      )}
    </div>
  );
}
