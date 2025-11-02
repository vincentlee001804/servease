import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getLanguageName, getSupportedLanguages } from '../i18n';
import { Languages } from 'lucide-react';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const { lang } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const supportedLanguages = getSupportedLanguages();

  const handleLanguageChange = (newLang) => {
    // Strip any existing language prefix at the start of the path
    const currentPath = location.pathname.replace(/^\/(en|bm|jtzw)(?=\/|$)/, '');
    const newPath = currentPath === '' || currentPath === '/'
      ? `/${newLang}`
      : `/${newLang}${currentPath}`;
    
    // Save language to localStorage for persistence
    localStorage.setItem('i18nextLng', newLang);
    
    // Change i18next language immediately
    i18n.changeLanguage(newLang);
    
    // Navigate to new path
    navigate(newPath);
  };

  return (
    <div className="relative group">
      <button className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors">
        <Languages className="h-4 w-4" />
        <span>{getLanguageName(lang || i18n.language)}</span>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="py-1">
          {supportedLanguages.map((languageCode) => (
            <button
              key={languageCode}
              onClick={() => handleLanguageChange(languageCode)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                (lang || i18n.language) === languageCode 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'text-gray-700'
              }`}
            >
              {getLanguageName(languageCode)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
