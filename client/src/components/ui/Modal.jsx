import { useEffect, useRef } from 'react';

export default function Modal({ open, title, children, onClose, onSubmit, primaryLabel = 'Save', secondaryLabel = 'Cancel', width = 540 }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape' && open) onClose?.(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={(e)=>{ if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="modal-dialog" style={{ maxWidth: width }} ref={dialogRef} role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        {title && (
          <div className="modal-header"><h3>{title}</h3></div>
        )}
        <div className="modal-body">
          {children}
        </div>
        <div className="modal-actions">
          <button className="btn btn-outline" type="button" onClick={onClose}>{secondaryLabel}</button>
          <button className="btn" type="button" onClick={onSubmit}>{primaryLabel}</button>
        </div>
      </div>
    </div>
  );
}
