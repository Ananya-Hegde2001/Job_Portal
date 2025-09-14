let listeners = [];
export function showToast(message, type='info', ttl=4000){
  const id = Math.random().toString(36).slice(2);
  const toast = { id, message, type };
  listeners.forEach(l => l(toast));
  setTimeout(()=>dismissToast(id), ttl);
}
export function onToast(fn){ listeners.push(fn); return () => { listeners = listeners.filter(f=>f!==fn); }; }
function dismissToast(id){ listeners.forEach(l => l({ id, dismiss:true })); }
