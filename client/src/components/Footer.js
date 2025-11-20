import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from './Logo';

const Footer = () => {
  const { t } = useTranslation(['footer', 'common']);
  const location = useLocation();
  const lang = location.pathname.split('/').filter(Boolean)[0] || 'en';

  // Helper function to create language-aware links
  const createLink = (path) => {
    const basePath = path.startsWith('/') ? path : `/${path}`;
    return `/${lang}${basePath}`;
  };

  return (
    <div className="bg-gray-900 pt-16">
      <footer className="text-white">
        <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <Logo size="md" variant="dark" />
            </div>
            <p className="text-gray-400 mb-4">
              {t('footer:company.description')}
            </p>
            <div className="text-sm text-gray-400">
              {t('footer:company.copyright')}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer:quickLinks.title')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to={createLink('/')} className="text-gray-400 hover:text-white transition-colors">
                  {t('common:navigation.home')}
                </Link>
              </li>
              <li>
                <Link to={createLink('/login')} className="text-gray-400 hover:text-white transition-colors">
                  {t('common:navigation.login')}
                </Link>
              </li>
              <li>
                <Link to={createLink('/register')} className="text-gray-400 hover:text-white transition-colors">
                  {t('common:navigation.register')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer:support.title')}</h3>
            <ul className="space-y-2">
              <li>
                <a href="mailto:bcs24020018@student.uts.edu.my" className="text-gray-400 hover:text-white transition-colors">
                  {t('footer:support.contact')}
                </a>
              </li>
              <li>
                <button className="text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer">
                  {t('footer:support.help')}
                </button>
              </li>
              <li>
                <button className="text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer">
                  {t('footer:support.privacy')}
                </button>
              </li>
              <li>
                <button className="text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer">
                  {t('footer:support.terms')}
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-3 pt-4 pb-4 text-center text-gray-400">
          <p>
            {t('footer:footer.tagline')}
          </p>
        </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
