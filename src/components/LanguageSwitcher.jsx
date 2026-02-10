import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher({ className = '', variant = 'button' }) {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language;

  const toggleLanguage = () => {
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  };

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
          currentLang === 'ar'
            ? 'bg-blue-900 text-white hover:bg-blue-800'
            : 'bg-amber-500 text-blue-900 hover:bg-amber-600'
        } ${className}`}
        aria-label={currentLang === 'ar' ? t('common.switchToEnglish') || 'Switch to English' : t('common.switchToArabic') || 'Switch to Arabic'}
      >
        {currentLang === 'ar' ? 'AR' : 'EN'}
      </button>
    );
  }

  // Dropdown variant (for existing language menu)
  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => toggleLanguage()}
        className="w-full text-right block px-4 py-3 text-sm text-slate-700 hover:bg-white"
      >
        {currentLang === 'ar' ? t('common.english') || 'English' : t('common.arabic') || 'العربية'}
      </button>
    </div>
  );
}

