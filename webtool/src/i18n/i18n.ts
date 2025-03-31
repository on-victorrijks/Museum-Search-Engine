import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import frTranslations from './locales/fr.json';
import enTranslations from './locales/en.json';
import nlTranslations from './locales/nl.json';

import LanguageDetector from 'i18next-browser-languagedetector';
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: {
        translation: frTranslations
      },
      en: {
        translation: enTranslations
      },
      nl: {
        translation: nlTranslations
      }
    },
    lng: 'fr', // langue par défaut
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n; 