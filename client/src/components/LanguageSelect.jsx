import React from 'react';
import { useTranslation } from 'react-i18next';

const LANGS = [
  { code: 'en', key: 'lang.english' },
  { code: 'kn', key: 'lang.kannada' },
  { code: 'hi', key: 'lang.hindi' },
  { code: 'ta', key: 'lang.tamil' },
  { code: 'te', key: 'lang.telugu' },
  { code: 'ml', key: 'lang.malayalam' },
  { code: 'bn', key: 'lang.bengali' },
  { code: 'gu', key: 'lang.gujarati' },
  { code: 'mr', key: 'lang.marathi' },
  { code: 'pa', key: 'lang.punjabi' },
  { code: 'or', key: 'lang.odia' },
  { code: 'ur', key: 'lang.urdu' },
];

export default function LanguageSelect() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [lang, setLang] = React.useState(i18n.language || 'en');
  const rootRef = React.useRef(null);

  React.useEffect(() => {
    function onDocClick(e) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const current = LANGS.find(l => l.code === lang) || LANGS[0];

  function changeLanguage(code) {
    setLang(code);
    i18n.changeLanguage(code);
    try { localStorage.setItem('lang', code); } catch {}
    setOpen(false);
  }

  return (
    <div className="lang-control" ref={rootRef}>
      <button
        type="button"
        className="lang-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('lang.label')}
        onClick={() => setOpen(v => !v)}
      >
        <svg className="globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/>
        </svg>
        <span className="lang-current">{t(current.key)}</span>
        <span className="caret" aria-hidden>▾</span>
      </button>
      {open && (
        <div className="lang-menu" role="listbox" aria-label={t('lang.label')}>
          {LANGS.map(({ code, key }) => (
            <div
              key={code}
              role="option"
              aria-selected={code === lang}
              tabIndex={0}
              className={`lang-item${code === lang ? ' active' : ''}`}
              onClick={() => changeLanguage(code)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') changeLanguage(code); }}
            >
              <span>{t(key)}</span>
              <span className="code">{code.toUpperCase()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
