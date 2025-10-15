import { useEffect, useMemo, useState } from 'react';
import { api } from '../util/api.js';

function relativeTime(iso){
  try{
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000; // seconds
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff/60)+' min ago';
    if (diff < 86400) return Math.floor(diff/3600)+' hr ago';
    if (diff < 172800) return 'yesterday';
    return d.toLocaleString();
  } catch { return iso; }
}

function groupByDay(items){
  const today = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
  const week = new Date(today); week.setDate(today.getDate()-7);
  const groups = { 'Today':[], 'Yesterday':[], 'This week':[], 'Earlier':[] };
  for (const n of items){
    const d = new Date(n.created_at); const day = new Date(d); day.setHours(0,0,0,0);
    if (day.getTime() === today.getTime()) groups['Today'].push(n);
    else if (day.getTime() === yesterday.getTime()) groups['Yesterday'].push(n);
    else if (day.getTime() >= week.getTime()) groups['This week'].push(n);
    else groups['Earlier'].push(n);
  }
  return groups;
}

function typeMeta(n){
  const t = n.type || '';
  if (t === 'application_submitted') return { icon:'📩', color:'#3b82f6', label:'Application' };
  if (t === 'application_status'){
    const msg = String(n.message||'').toLowerCase();
    if (msg.includes('hired')) return { icon:'🏆', color:'#16a34a', label:'Status' };
    if (msg.includes('shortlist')) return { icon:'✅', color:'#22c55e', label:'Status' };
    if (msg.includes('reject')) return { icon:'❌', color:'#ef4444', label:'Status' };
    return { icon:'🔔', color:'#6366f1', label:'Status' };
  }
  return { icon:'🔔', color:'#64748b', label:'Update' };
}

export default function Notifications(){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const unreadCount = useMemo(()=> items.filter(n => !n.is_read).length, [items]);

  async function load(){
    try{
      setLoading(true); setError(null);
      const res = await api.listNotifications();
      const list = (res.notifications || []).sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));
      setItems(list);
    } catch(e){ setError(e?.message || 'Failed to load'); }
    finally{ setLoading(false); }
  }

  useEffect(()=>{ load(); },[]);

  async function markRead(id){
    try{
      await api.markNotificationRead(id);
      setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch(e){ /* ignore */ }
  }

  async function markAll(){
    const unread = items.filter(n => !n.is_read);
    for (const n of unread){
      try{ await api.markNotificationRead(n.id); } catch { /* ignore */ }
    }
    setItems(prev => prev.map(n => ({ ...n, is_read: 1 })));
  }

  const listToShow = useMemo(()=> showUnreadOnly ? items.filter(n=>!n.is_read) : items, [items, showUnreadOnly]);
  const grouped = useMemo(()=> groupByDay(listToShow), [listToShow]);

  return (
    <section className="layout" style={{marginTop:'1rem'}}>
      <div className="card" style={{padding:'1rem 1.1rem'}}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'.75rem', flexWrap:'wrap' }}>
          <div style={{display:'flex', alignItems:'baseline', gap:'.6rem'}}>
            <h2 style={{margin:'0 0 .2rem'}}>Notifications</h2>
            <span className="muted" style={{fontSize:'.8rem'}}>({unreadCount} unread)</span>
          </div>
          <div style={{ display:'flex', gap:'.5rem', alignItems:'center' }}>
            <label style={{ display:'inline-flex', alignItems:'center', gap:'.4rem', fontSize:'.8rem' }}>
              <input type="checkbox" checked={showUnreadOnly} onChange={e=>setShowUnreadOnly(e.target.checked)} />
              Unread only
            </label>
            <button className="btn btn-sm btn-outline" onClick={load}>Refresh</button>
            {unreadCount > 0 && <button className="btn btn-sm" onClick={markAll}>Mark all as read</button>}
          </div>
        </div>

        {loading && (
          <div style={{ display:'grid', gap:'.6rem', marginTop:'1rem' }}>
            {Array.from({length:4}).map((_,i)=> (
              <div key={i} className="row-line" style={{opacity:.6}}>
                <div style={{ width:36, height:36, borderRadius:12, background:'var(--color-surface-alt)' }} />
                <div style={{ flex:1 }}>
                  <div style={{ height:10, background:'var(--color-surface-alt)', borderRadius:6, marginBottom:6 }} />
                  <div style={{ height:8, width:'50%', background:'var(--color-surface-alt)', borderRadius:6 }} />
                </div>
                <div style={{ width:90, height:8, background:'var(--color-surface-alt)', borderRadius:6 }} />
              </div>
            ))}
          </div>
        )}
        {error && <p style={{color:'var(--color-danger)'}}>{error}</p>}
        {!loading && !error && listToShow.length===0 && (
          <div className="card" style={{ padding:'1rem', background:'var(--color-surface-alt)' }}>
            <div style={{ fontSize:'1.2rem' }}>🎉 All caught up</div>
            <div className="muted" style={{ fontSize:'.85rem' }}>You have no {showUnreadOnly ? 'unread ' : ''}notifications.</div>
          </div>
        )}

        {!loading && !error && listToShow.length>0 && (
          <div style={{ display:'grid', gap:'1rem', marginTop:'.5rem' }}>
            {Object.entries(grouped).map(([label, arr]) => (
              !arr.length ? null : (
                <div key={label} style={{ display:'grid', gap:'.5rem' }}>
                  <div className="muted" style={{ fontWeight:700, letterSpacing:'.3px', fontSize:'.75rem', textTransform:'uppercase' }}>{label}</div>
                  <div className="list-clean" style={{ display:'grid', gap:'.35rem' }}>
                    {arr.map(n => {
                      const meta = typeMeta(n);
                      return (
                        <div key={n.id} className="row-line" style={{ alignItems:'flex-start', padding:'.6rem', borderRadius:'12px', background: n.is_read ? 'var(--color-surface)' : 'linear-gradient(180deg,var(--color-surface),rgba(255,255,255,.02))', border:'1px solid var(--color-border)' }}>
                          <div style={{ width:38, height:38, borderRadius:'12px', background: meta.color, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', boxShadow:'0 4px 14px -6px rgba(0,0,0,.4)' }}>{meta.icon}</div>
                          <div style={{ display:'grid', gap:'.2rem', flex:1 }}>
                            <div style={{ fontWeight: n.is_read ? 500 : 700 }}>{n.message}</div>
                            <div className="muted" style={{ fontSize:'.68rem' }}>{relativeTime(n.created_at)}</div>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:'.4rem' }}>
                            {!n.is_read && (
                              <button className="btn btn-sm btn-outline" onClick={()=>markRead(n.id)} title="Mark as read">Mark read</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
