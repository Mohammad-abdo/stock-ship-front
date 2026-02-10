import { useState, useEffect } from 'react';

const LANGUAGE_KEY = 'stockship_language';
const DEFAULT_LANGUAGE = 'ar';

export function useLanguage() {
  const [language, setLanguageState] = useState(() => {
    // Get from localStorage or default to Arabic
    const saved = localStorage.getItem(LANGUAGE_KEY);
    return saved || DEFAULT_LANGUAGE;
  });

  useEffect(() => {
    // Update HTML lang and dir attributes
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    // Save to localStorage
    localStorage.setItem(LANGUAGE_KEY, language);
  }, [language]);

  const setLanguage = (lang) => {
    setLanguageState(lang);
  };

  return [language, setLanguage];
}

