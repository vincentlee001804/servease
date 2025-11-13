import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getSupportedLanguages, isValidLanguage } from '../config/i18n';

const LanguageWrapper = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const pathLang = segments[0];
    const defaultLang = 'en';

    // No language segment → prefix default once
    if (!pathLang) {
      navigate(`/${defaultLang}${location.pathname === '/' ? '' : location.pathname}`, { replace: true });
      return;
    }

    // Invalid language → replace first segment with default
    if (!isValidLanguage(pathLang)) {
      const rest = segments.slice(1).join('/');
      const newPath = rest ? `/${defaultLang}/${rest}` : `/${defaultLang}`;
      navigate(newPath, { replace: true });
      return;
    }

    // Sync i18next when valid and save to localStorage for persistence
    if (i18n.language !== pathLang) {
      i18n.changeLanguage(pathLang);
      // Explicitly save to localStorage for persistence across navigation
      localStorage.setItem('i18nextLng', pathLang);
    }
  }, [navigate, location.pathname, i18n]);

  return children;
};

export default LanguageWrapper;
