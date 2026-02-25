import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Globe, Check } from 'lucide-react';

const LANGUAGES = [
  { code: 'ar', label: 'العربية', labelEn: 'Arabic' },
  { code: 'en', label: 'English', labelEn: 'English' },
  { code: 'zh', label: '中文', labelEn: 'Chinese' },
];

export default function LanguageSwitcher({ className = '', variant = 'button' }) {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language?.split('-')[0] || 'ar';
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const setLanguage = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  if (variant === 'button') {
    return (
      <div className={`relative ${className}`} ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-colors min-h-[44px]"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={t('nav.language')}
        >
          <Globe className="h-4 w-4 text-slate-500 shrink-0" />
          <span className="whitespace-nowrap">{current.label}</span>
          <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div
            role="listbox"
            className="absolute top-full mt-1.5 min-w-[180px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg z-[100]"
            style={i18n.dir() === 'rtl' ? { right: 0 } : { left: 0 }}
          >
            {LANGUAGES.map((lang) => {
              const isActive = currentLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => setLanguage(lang.code)}
                  className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-sm transition-colors ${
                    isActive ? 'bg-blue-50 text-(--primary) font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  } ${i18n.dir() === 'rtl' ? 'flex-row-reverse text-right' : 'text-left'}`}
                >
                  <span>{lang.label}</span>
                  {isActive && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Dropdown variant (for sidebar / portal menu): list of all languages
  return (
    <div className={className}>
      {LANGUAGES.map((lang) => {
        const isActive = currentLang === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-sm transition-colors ${
              isActive ? 'bg-blue-50 text-(--primary) font-semibold' : 'text-slate-700 hover:bg-slate-50'
            } ${i18n.dir() === 'rtl' ? 'flex-row-reverse text-right' : 'text-left'}`}
          >
            <span>{lang.label}</span>
            {isActive && <Check className="h-4 w-4 shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}
