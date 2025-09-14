import { useEffect, useState } from 'react';
import { onToast } from '../util/toast.js';

export default function Toaster(){
  const [items,setItems] = useState([]);
  useEffect(()=>onToast(t => {
    if (t.dismiss){ setItems(i => i.filter(x=>x.id!==t.id)); return; }
    setItems(i => [...i, t]);
  }),[]);
  return (
    <div id="toaster-root">
      {items.map(t => (
        <div key={t.id} className={`toast ${t.type === 'success' ? 'toast-success' : t.type === 'error' ? 'toast-error' : ''}`}>{t.message}</div>
      ))}
    </div>
  );
}
