import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './locales/ar/common.json';
import en from './locales/en/common.json';

// Get language from localStorage or default to Arabic
const getInitialLanguage = (): string => {
  const saved = localStorage.getItem('lang');
  if (saved === 'ar' || saved === 'en') {
    return saved;
  }
  // Default to Arabic
  localStorage.setItem('lang', 'ar');
  return 'ar';
};

const initialLanguage = getInitialLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: {
        translation: ar,
      },
      en: {
        translation: en,
      },
    },
    lng: initialLanguage,
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

// Update HTML attributes when language changes
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  localStorage.setItem('lang', lng);
});

// Set initial HTML attributes
document.documentElement.lang = initialLanguage;
document.documentElement.dir = initialLanguage === 'ar' ? 'rtl' : 'ltr';

export default i18n;

