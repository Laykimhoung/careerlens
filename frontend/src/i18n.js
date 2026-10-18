import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enAdmin from './locales/en/admin.json';
import enCandidate from './locales/en/candidate.json';
import enCompany from './locales/en/company.json';
import enValidation from './locales/en/validation.json';

import kmCommon from './locales/km/common.json';
import kmAuth from './locales/km/auth.json';
import kmAdmin from './locales/km/admin.json';
import kmCandidate from './locales/km/candidate.json';
import kmCompany from './locales/km/company.json';
import kmValidation from './locales/km/validation.json';

const savedLanguage = localStorage.getItem('cl_language') || localStorage.getItem('language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        auth: enAuth,
        admin: enAdmin,
        candidate: enCandidate,
        company: enCompany,
        validation: enValidation,
      },
      km: {
        common: kmCommon,
        auth: kmAuth,
        admin: kmAdmin,
        candidate: kmCandidate,
        company: kmCompany,
        validation: kmValidation,
      },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'auth', 'admin', 'candidate', 'company', 'validation'],
    interpolation: {
      escapeValue: false, // React already safes from XSS
    },
  });

export default i18n;
