import i18next from 'i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// Custom language codes mapping
const languageMap = {
  'en': 'en',
  'bm': 'bm', 
  'jtzw': 'jtzw'
};

// Reverse mapping for display
const languageNames = {
  'en': 'English',
  'bm': 'Bahasa Malaysia',
  'jtzw': '简体中文'
};

i18next
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Supported languages with your custom codes
    supportedLngs: ['en', 'bm', 'jtzw'],
    
    // Default namespace
    defaultNS: 'common',
    
    // Namespaces to load
    ns: ['common', 'homepage', 'footer'],
    
    // Backend configuration for loading translations
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json'
    },
    
    // Language detection configuration
    detection: {
      order: ['path', 'localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      lookupFromPathIndex: 0,
      caches: ['localStorage'],
      
      // Custom path detection for your language codes
      checkWhitelist: true
    },
    
    // Interpolation settings
    interpolation: {
      escapeValue: false
    },
    
    // Load only language part (not region)
    load: 'languageOnly',
    
    // Fallback language
    fallbackLng: 'en',
    
    // Debug mode (set to false in production)
    debug: process.env.NODE_ENV === 'development'
  });

// Export language utilities
export const getLanguageName = (code) => languageNames[code] || code;
export const getSupportedLanguages = () => Object.keys(languageNames);
export const isValidLanguage = (code) => Object.keys(languageMap).includes(code);

export default i18next;
