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
   * t(key, fallbackOrParams, maybeParams) — translates a key.
   * Supports:
   *  - Dot-notation: "admin.title", "nav.dashboard", "common.interview"
   *  - Direct key: "welcome", "save", "title"
   *  - Parameter interpolation: { count: 5 } replaces {{count}}
   *  - Fallback string if key not found
   */
  const t = useCallback((key, fallbackOrParams, maybeParams) => {
    if (!key) return '';

    const fallback = typeof fallbackOrParams === 'string' ? fallbackOrParams : '';
    const params = typeof fallbackOrParams === 'object' && fallbackOrParams !== null
      ? fallbackOrParams
      : (typeof maybeParams === 'object' && maybeParams !== null ? maybeParams : null);

    const lookup = (dict) => {
      if (!dict) return undefined;
      if (dict[key] !== undefined) return dict[key];
      if (key.includes('.')) {
        const parts = key.split('.');
        let cur = dict;
        for (const p of parts) {
          if (cur && cur[p] !== undefined) {
            cur = cur[p];
          } else {
            cur = undefined;
            break;
          }
        }
        if (cur !== undefined && typeof cur === 'string') return cur;
      }
      return undefined;
    };

    let result = lookup(dictionaries[language]);
    if (result === undefined) {
      result = lookup(dictionaries.en);
    }
    if (result === undefined && i18n && typeof i18n.t === 'function') {
      const translated = i18n.t(key, params || {});
      if (translated && translated !== key) {
        result = translated;
      }
    }
    if (result === undefined) {
      result = fallback || key;
    }

    if (typeof result === 'string' && params) {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        result = result
          .replace(new RegExp(`\\{\\{\\s*${paramKey}\\s*\\}\\}`, 'g'), String(paramVal))
          .replace(new RegExp(`\\{\\s*${paramKey}\\s*\\}`, 'g'), String(paramVal));
      });
    }

    return result;
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
