import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import i18n from '../i18n';
import en from '../locales/en';
import km from '../locales/km';

export const LanguageContext = createContext();

const dictionaries = { en, km };

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('cl_language') || localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('cl_language', language);
    localStorage.setItem('language', language);
    document.documentElement.lang = language === 'km' ? 'km' : 'en';
    document.documentElement.setAttribute('lang', language === 'km' ? 'km' : 'en');
    if (i18n && i18n.changeLanguage) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  /**
   * t(key) — translates a key.
   * Supports:
   *  - Dot-notation: "admin.title", "nav.dashboard", "common.save"
   *  - Direct key: "welcome", "save", "title"
   * Falls back to English, then to the key string.
   */
  const t = useCallback((key) => {
    if (!key) return '';
    const currentDict = dictionaries[language] || dictionaries.en;
    if (currentDict && currentDict[key] !== undefined) {
      return currentDict[key];
    }
    // Fallback to English dictionary
    if (dictionaries.en && dictionaries.en[key] !== undefined) {
      return dictionaries.en[key];
    }
    // Fallback to i18n if available
    if (i18n && typeof i18n.t === 'function') {
      const translated = i18n.t(key);
      if (translated && translated !== key) return translated;
    }
    return key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, i18n }}>
      {children}
    </LanguageContext.Provider>
  );
};

/** Convenience hook — use inside any component */
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}
