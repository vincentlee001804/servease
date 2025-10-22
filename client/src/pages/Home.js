import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { QrCode, Smartphone, Calendar, Globe, Users, Shield } from 'lucide-react';

const Home = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: <QrCode className="w-8 h-8 text-blue-600" />,
      title: 'QR Code Access',
      description: 'Customers scan QR codes to instantly access your service menu and book appointments.'
    },
    {
      icon: <Smartphone className="w-8 h-8 text-blue-600" />,
      title: 'Mobile-First Design',
      description: 'Optimized for mobile devices with no app download required. Works on any smartphone.'
    },
    {
      icon: <Calendar className="w-8 h-8 text-blue-600" />,
      title: 'Real-Time Booking',
      description: 'Live availability calendar with instant booking confirmation for seamless customer experience.'
    },
    {
      icon: <Globe className="w-8 h-8 text-blue-600" />,
      title: 'Multilingual Support',
      description: 'Support for English, Bahasa Malaysia, and Chinese to serve diverse local communities.'
    },
    {
      icon: <Users className="w-8 h-8 text-blue-600" />,
      title: 'Easy Management',
      description: 'Simple dashboard for vendors to manage services, bookings, and customer information.'
    },
    {
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      title: 'Secure & Reliable',
      description: 'Built with security in mind to protect your business and customer data.'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Digital Service Menu
            <br />
            <span className="text-blue-200">Made Simple</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Transform your local business with QR code-powered service discovery and booking. 
            No app downloads required for customers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="btn btn-primary bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4"
            >
              Start Free Trial
            </Link>
            <Link
              to="/login"
              className="btn btn-outline border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4"
            >
              {t('login')}
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Digitize Your Services
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From QR code generation to booking management, ServEase provides all the tools 
              local businesses need to modernize their customer experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  {feature.icon}
                  <h3 className="text-xl font-semibold text-gray-900 ml-3">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in minutes with our simple 3-step process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Create Your Profile
              </h3>
              <p className="text-gray-600">
                Sign up and add your business information, services, and pricing. 
                Set your operating hours and availability.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Generate QR Code
              </h3>
              <p className="text-gray-600">
                Get your unique QR code and shareable link. Display the QR code 
                in your store or share the link digitally.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Start Receiving Bookings
              </h3>
              <p className="text-gray-600">
                Customers scan your QR code or click your link to browse services 
                and book appointments instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Digitize Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of local businesses already using ServEase to modernize 
            their customer experience.
          </p>
          <Link
            to="/register"
            className="btn bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4"
          >
            Get Started Today
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
