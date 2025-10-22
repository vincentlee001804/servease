import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { 
  QrCode, 
  Smartphone, 
  Calendar, 
  Globe, 
  Users, 
  Shield, 
  ArrowRight, 
  Star,
  Clock,
  CheckCircle,
  Zap,
  Heart,
  TrendingUp
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const HomeFoodApp = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: <QrCode className="w-6 h-6" />,
      title: 'Instant QR Access',
      description: 'Scan and book in seconds',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: 'Mobile Optimized',
      description: 'Works on any device',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Real-time Booking',
      description: 'Live availability',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Multilingual',
      description: '3 languages supported',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const stats = [
    { number: '500+', label: 'Active Businesses', icon: <Users className="w-5 h-5" /> },
    { number: '10K+', label: 'Bookings Made', icon: <Calendar className="w-5 h-5" /> },
    { number: '98%', label: 'Satisfaction Rate', icon: <Heart className="w-5 h-5" /> },
    { number: '24/7', label: 'Support Available', icon: <Clock className="w-5 h-5" /> }
  ];

  const steps = [
    {
      step: '01',
      title: 'Create Profile',
      description: 'Add your business details and services',
      icon: <Users className="w-8 h-8" />
    },
    {
      step: '02',
      title: 'Generate QR',
      description: 'Get your unique QR code instantly',
      icon: <QrCode className="w-8 h-8" />
    },
    {
      step: '03',
      title: 'Start Booking',
      description: 'Customers can book immediately',
      icon: <Calendar className="w-8 h-8" />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-white/5"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium mb-8">
              <Star className="w-4 h-4 mr-2 text-yellow-400" />
              Trusted by 500+ Local Businesses
            </div>
            
            {/* Main Heading */}
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              Digital Service Menu
              <br />
              <span className="text-yellow-300">Made Simple</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your local business with QR code-powered service discovery and booking. 
              No app downloads required for customers.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto font-semibold">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4 h-auto font-semibold">
                {t('login')}
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                  <div className="flex justify-center mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      {stat.icon}
                    </div>
                  </div>
                  <div className="text-2xl font-bold mb-1">{stat.number}</div>
                  <div className="text-sm text-blue-100">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From QR code generation to booking management, ServEase provides all the tools 
              local businesses need to modernize their customer experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in minutes with our simple 3-step process
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform translate-x-8"></div>
                )}
                
                <Card className="relative bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  <CardContent className="p-8 text-center">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                        {step.step}
                      </div>
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                        <div className="text-blue-600">
                          {step.icon}
                        </div>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
                Why Choose ServEase?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Join hundreds of local businesses already using ServEase to modernize 
                their customer experience and grow their business.
              </p>
              
              <div className="space-y-6">
                {[
                  { icon: <Zap className="w-6 h-6" />, text: "Setup in under 5 minutes" },
                  { icon: <CheckCircle className="w-6 h-6" />, text: "No technical knowledge required" },
                  { icon: <TrendingUp className="w-6 h-6" />, text: "Increase bookings by 40%" },
                  { icon: <Heart className="w-6 h-6" />, text: "Loved by customers and vendors" }
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                      {benefit.icon}
                    </div>
                    <span className="text-lg text-gray-700">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 text-white">
                <div className="text-center">
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <QrCode className="w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
                  <p className="text-blue-100 mb-6">
                    Create your account and start receiving bookings in minutes
                  </p>
                  <Button className="bg-white text-blue-600 hover:bg-gray-100 font-semibold">
                    Get Started Now
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">
            Ready to Digitize Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join hundreds of local businesses already using ServEase to modernize 
            their customer experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto font-semibold">
              Get Started Today
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4 h-auto font-semibold">
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeFoodApp;
