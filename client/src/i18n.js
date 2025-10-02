import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/translation.json';
import kn from './locales/kn/translation.json';
import hi from './locales/hi/translation.json';
import ta from './locales/ta/translation.json';
import te from './locales/te/translation.json';
import ml from './locales/ml/translation.json';
import bn from './locales/bn/translation.json';
import gu from './locales/gu/translation.json';
import mr from './locales/mr/translation.json';
import pa from './locales/pa/translation.json';
import or from './locales/or/translation.json';
import ur from './locales/ur/translation.json';

const resources = {
  en: { translation: en },
  kn: { translation: kn },
  hi: { translation: hi },
  ta: { translation: ta },
  te: { translation: te },
  ml: { translation: ml },
  bn: { translation: bn },
  gu: { translation: gu },
  mr: { translation: mr },
  pa: { translation: pa },
  or: { translation: or },
  ur: { translation: ur },
};

const saved = typeof window !== 'undefined' ? localStorage.getItem('lang') : null;
const lng = saved || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

// Apply initial dir/lang to document
try {
  if (typeof document !== 'undefined') {
    const dir = i18n.dir ? i18n.dir(lng) : (['ar','he','fa','ur'].includes(lng) ? 'rtl' : 'ltr');
    document.documentElement.dir = dir;
    document.documentElement.lang = lng;
  }
} catch {}

// Update dir/lang when language changes
i18n.on('languageChanged', (language) => {
  try {
    if (typeof document !== 'undefined') {
      const dir = i18n.dir ? i18n.dir(language) : (['ar','he','fa','ur'].includes(language) ? 'rtl' : 'ltr');
      document.documentElement.dir = dir;
      document.documentElement.lang = language;
    }
    if (typeof window !== 'undefined') localStorage.setItem('lang', language);
  } catch {}
});

export default i18n;
