import { useRef, useState } from 'react';

export default function ChipsInput({ value = [], onChange, placeholder = 'Add a skill and press Enter', max = 20 }) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);
  const add = () => {
    const v = String(draft || '').trim();
    if (!v) return; if (value.includes(v)) { setDraft(''); return; }
    if (value.length >= max) return;
    onChange?.([...value, v]); setDraft('');
  };
  const onKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); add(); }
    if (e.key === 'Backspace' && !draft && value.length) {
      const copy = value.slice(0, -1);
      onChange?.(copy);
    }
  };
  const remove = (i) => onChange?.(value.filter((_,idx)=>idx!==i));
  return (
    <div className="chips-input">
      <div className="chips-row">
        {value.map((chip, i) => (
          <span key={i} className="chip-tag">
            {chip}
            <button type="button" className="chip-x" onClick={()=>remove(i)} aria-label="Remove">✕</button>
          </span>
        ))}
        <input ref={inputRef} value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={onKeyDown} placeholder={placeholder} />
      </div>
      <div className="chips-actions">
        <button type="button" className="btn btn-sm" onClick={add}>Add</button>
      </div>
    </div>
  );
}
