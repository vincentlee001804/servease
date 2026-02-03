import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import i18next from '../config/i18n';
import { Building2 } from 'lucide-react';

const LoginFirebase = () => {
  const [googleLoading, setGoogleLoading] = useState(false);

  const { user, isLoggingIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pathLang = location.pathname.split('/').filter(Boolean)[0] || 'en';
  const { t } = useTranslation('common');

  // Sync i18next language with URL language
  useEffect(() => {
    if (pathLang && i18next.language !== pathLang) {
      i18next.changeLanguage(pathLang);
    }
  }, [pathLang]);

  // Redirect to dashboard when user is authenticated
  useEffect(() => {
    console.log('LoginFirebase useEffect triggered:', { user: !!user, isLoggingIn, userEmail: user?.email, pathLang });
    if (user && !isLoggingIn) {
      console.log('LoginFirebase: User authenticated, navigating to dashboard...');
      // Add a small delay to prevent race conditions
      setTimeout(() => {
        // Ensure language is preserved from current URL path
        const lang = pathLang || localStorage.getItem('i18nextLng') || 'en';
        navigate(`/${lang}/dashboard`, { replace: true });
      }, 100);
    }
  }, [user, isLoggingIn, navigate, pathLang]);

  const handleGoogleSignIn = async () => {
    if (!signInWithGoogle) return;
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result?.success) {
        const lang = pathLang || localStorage.getItem('i18nextLng') || 'en';
        navigate(`/${lang}/dashboard`, { replace: true });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{t('login.welcomeBack')}</h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('login.signInToAccount')}
            </p>
          </div>

          {/* Google-only */}
          <div className="space-y-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 border border-blue-100 bg-blue-50/60 rounded-lg py-3 text-sm sm:text-base font-semibold text-blue-700 hover:bg-blue-100 hover:border-blue-200 transition-colors disabled:opacity-60 shadow-sm"
            >
              <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-lg font-bold text-blue-600 border border-gray-200">
                G
              </span>
              {googleLoading ? t('login.signingIn') : t('login.continueWithGoogle')}
            </button>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t('login.noAccount')}{' '}
              <Link
                to={`/${pathLang}/register`}
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                {t('login.createAccount')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginFirebase;
