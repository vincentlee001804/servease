import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  QrCode, 
  Smartphone, 
  Calendar, 
  Globe, 
  Users, 
  CheckCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

const HomeModern = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('homepage');
  const lang = location.pathname.split('/').filter(Boolean)[0] || 'en';

  // Helper function to create language-aware links
  const createLink = (path) => {
    const basePath = path.startsWith('/') ? path : `/${path}`;
    return `/${lang}${basePath}`;
  };

  const features = useMemo(() => [
    {
      icon: <QrCode className="w-6 h-6" />,
      title: t('features.instantQR.title'),
      description: t('features.instantQR.description'),
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: t('features.mobileFirst.title'),
      description: t('features.mobileFirst.description'),
      color: 'from-green-500 to-green-600',
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: t('features.realTime.title'),
      description: t('features.realTime.description'),
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: t('features.multilingual.title'),
      description: t('features.multilingual.description'),
      color: 'from-yellow-500 to-yellow-600',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: t('features.customerMgmt.title'),
      description: t('features.customerMgmt.description'),
      color: 'from-red-500 to-red-600',
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: t('features.effortlessSetup.title'),
      description: t('features.effortlessSetup.description'),
      color: 'from-teal-500 to-teal-600',
    },
  ], [t]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zm0-30V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          transform: 'scale(2)'
        }}></div>
        <div className="relative z-10 container mx-auto px-6 text-center max-w-6xl">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4 animate-fade-in-down">
            {t('hero.title')}
          </h1>
          <p className="text-lg md:text-xl mb-8 opacity-90 animate-fade-in-up max-w-3xl mx-auto">
            {t('hero.subtitle')}
          </p>
          <div className="flex justify-center animate-fade-in-up">
            <Button 
              onClick={() => navigate(createLink('/register'))}
              className="bg-white text-blue-600 hover:bg-gray-100 text-xl px-12 py-5 h-auto font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              {t('hero.cta')}
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 text-center max-w-7xl">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-16">
            {t('features.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 items-stretch">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg h-full flex flex-col hover:-translate-y-2">
                <div className="p-8 flex flex-col items-center text-center h-full">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 text-white shadow-lg`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed flex-grow text-sm">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-gray-100">
        <div className="container mx-auto px-6 text-center max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-12">
            {t('howItWorks.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-center justify-items-center">
            <div className="text-center">
              <QrCode className="w-20 h-20 text-blue-600 mx-auto mb-6 animate-bounce-slow" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('howItWorks.step1.title')}
              </h3>
              <p className="text-gray-600">
                {t('howItWorks.step1.description')}
              </p>
            </div>
            <div className="text-center">
              <Smartphone className="w-20 h-20 text-green-600 mx-auto mb-6 animate-bounce-slow delay-100" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('howItWorks.step2.title')}
              </h3>
              <p className="text-gray-600">
                {t('howItWorks.step2.description')}
              </p>
            </div>
            <div className="text-center">
              <Calendar className="w-20 h-20 text-purple-600 mx-auto mb-6 animate-bounce-slow delay-200" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('howItWorks.step3.title')}
              </h3>
              <p className="text-gray-600">
                {t('howItWorks.step3.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 text-center max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-12">
            {t('testimonials.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 justify-items-center">
            <Card className="p-8 shadow-lg border-0">
              <p className="text-lg text-gray-700 italic mb-6">
                "{t('testimonials.testimonial1.text')}"
              </p>
              <div className="flex items-center justify-center">
                <img
                  src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEgzMFYzMEgyMFYyMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+"
                  alt="Client 1"
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <p className="font-semibold text-gray-900">{t('testimonials.testimonial1.author')}</p>
                  <p className="text-sm text-gray-600">{t('testimonials.testimonial1.role')}</p>
                </div>
              </div>
            </Card>
            <Card className="p-8 shadow-lg border-0">
              <p className="text-lg text-gray-700 italic mb-6">
                "{t('testimonials.testimonial2.text')}"
              </p>
              <div className="flex items-center justify-center">
                <img
                  src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEgzMFYzMEgyMFYyMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+"
                  alt="Client 2"
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <p className="font-semibold text-gray-900">{t('testimonials.testimonial2.author')}</p>
                  <p className="text-sm text-gray-600">{t('testimonials.testimonial2.role')}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16 md:py-24">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('cta.title')}
          </h2>
          <p className="text-lg md:text-xl mb-10 opacity-90">
            {t('cta.subtitle')}
          </p>
          <Button 
            onClick={() => navigate(createLink('/register'))}
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {t('cta.button')}
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomeModern;