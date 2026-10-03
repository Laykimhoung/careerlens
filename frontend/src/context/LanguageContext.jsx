import React, { createContext, useState, useEffect } from 'react';
import en from '../locales/en';
import km from '../locales/km';

export const LanguageContext = createContext();

const dictionaries = { en, km };

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    return dictionaries[language]?.[key] || dictionaries['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
