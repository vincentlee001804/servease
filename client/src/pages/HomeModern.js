import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { QrCode, Smartphone, Calendar, Globe, Users, Shield, ArrowRight, CheckCircle, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const HomeModern = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: <QrCode className="w-8 h-8 text-blue-600" />,
      title: 'QR Code Access',
      description: 'Customers scan QR codes to instantly access your service menu and book appointments.',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      icon: <Smartphone className="w-8 h-8 text-green-600" />,
      title: 'Mobile-First Design',
      description: 'Optimized for mobile devices with no app download required. Works on any smartphone.',
      color: 'bg-green-50 text-green-600'
    },
    {
      icon: <Calendar className="w-8 h-8 text-purple-600" />,
      title: 'Real-Time Booking',
      description: 'Live availability calendar with instant booking confirmation for seamless customer experience.',
      color: 'bg-purple-50 text-purple-600'
    },
    {
      icon: <Globe className="w-8 h-8 text-orange-600" />,
      title: 'Multilingual Support',
      description: 'Support for English, Bahasa Malaysia, and Chinese to serve diverse local communities.',
      color: 'bg-orange-50 text-orange-600'
    },
    {
      icon: <Users className="w-8 h-8 text-indigo-600" />,
      title: 'Easy Management',
      description: 'Simple dashboard for vendors to manage services, bookings, and customer information.',
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      icon: <Shield className="w-8 h-8 text-red-600" />,
      title: 'Secure & Reliable',
      description: 'Built with security in mind to protect your business and customer data.',
      color: 'bg-red-50 text-red-600'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Create Your Profile',
      description: 'Sign up and add your business information, services, and pricing. Set your operating hours and availability.',
      icon: <Users className="w-6 h-6" />
    },
    {
      number: '02',
      title: 'Generate QR Code',
      description: 'Get your unique QR code and shareable link. Display the QR code in your store or share the link digitally.',
      icon: <QrCode className="w-6 h-6" />
    },
    {
      number: '03',
      title: 'Start Receiving Bookings',
      description: 'Customers scan your QR code or click your link to browse services and book appointments instantly.',
      icon: <Calendar className="w-6 h-6" />
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      business: 'Beauty Salon',
      content: 'ServEase transformed our booking process. Customers love the convenience of scanning QR codes!',
      rating: 5
    },
    {
      name: 'Ahmad Rahman',
      business: 'Repair Shop',
      content: 'The multilingual support helps us serve our diverse community better. Highly recommended!',
      rating: 5
    },
    {
      name: 'Lisa Wong',
      business: 'Spa Center',
      content: 'Easy to use dashboard and real-time booking notifications. Our business has grown significantly!',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800 mb-6">
              <Star className="w-4 h-4 mr-2" />
              Trusted by 500+ Local Businesses
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Digital Service Menu
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your local business with QR code-powered service discovery and booking. 
              No app downloads required for customers.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="text-lg px-8 py-4 h-auto">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto">
                {t('login')}
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
                <div className="text-gray-600">Active Businesses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">10K+</div>
                <div className="text-gray-600">Bookings Made</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">98%</div>
                <div className="text-gray-600">Customer Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Digitize Your Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From QR code generation to booking management, ServEase provides all the tools 
              local businesses need to modernize their customer experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                <CardHeader>
                  <div className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in minutes with our simple 3-step process
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    {step.number}
                  </div>
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                    {step.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Loved by Local Businesses
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers are saying about ServEase
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.business}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Ready to Digitize Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join hundreds of local businesses already using ServEase to modernize 
            their customer experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4 h-auto">
              Get Started Today
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 h-auto border-white text-white hover:bg-white hover:text-blue-600">
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeModern;
