import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  QrCode, 
  Smartphone, 
  Calendar, 
  Globe, 
  Users, 
  ArrowRight, 
  Star,
  Clock,
  CheckCircle,
  Zap,
  Heart,
  TrendingUp
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

const HomeModern = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <QrCode className="w-6 h-6" />,
      title: 'Instant QR Access',
      description: 'Scan and book in seconds',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: 'Mobile-First Design',
      description: 'Seamless experience on any device',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Real-time Booking',
      description: 'See availability and book instantly',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Multilingual Support',
      description: 'Reach a wider customer base',
      color: 'from-yellow-500 to-yellow-600',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Customer Management',
      description: 'Track bookings and customer preferences',
      color: 'from-red-500 to-red-600',
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: 'Effortless Setup',
      description: 'Get your business online in minutes',
      color: 'from-teal-500 to-teal-600',
    },
  ];

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
            ServEase: Your Business, Digitized.
          </h1>
          <p className="text-lg md:text-xl mb-8 opacity-90 animate-fade-in-up max-w-3xl mx-auto">
            Effortless QR-based booking and digital menus for local services.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 animate-fade-in-up">
            <Button 
              onClick={() => navigate('/register')}
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Free Trial
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/login')}
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Login
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 text-center max-w-7xl">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-16">
            Streamline Your Services
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
            How ServEase Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-center justify-items-center">
            <div className="text-center">
              <QrCode className="w-20 h-20 text-blue-600 mx-auto mb-6 animate-bounce-slow" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                1. Create Your Digital Menu
              </h3>
              <p className="text-gray-600">
                Easily set up your services, prices, and availability in minutes.
              </p>
            </div>
            <div className="text-center">
              <Smartphone className="w-20 h-20 text-green-600 mx-auto mb-6 animate-bounce-slow delay-100" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                2. Generate & Share QR Code
              </h3>
              <p className="text-gray-600">
                Get a unique QR code and shareable link for your customers.
              </p>
            </div>
            <div className="text-center">
              <Calendar className="w-20 h-20 text-purple-600 mx-auto mb-6 animate-bounce-slow delay-200" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                3. Receive Instant Bookings
              </h3>
              <p className="text-gray-600">
                Customers scan, browse, and book directly from their phones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 text-center max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-12">
            What Our Vendors Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 justify-items-center">
            <Card className="p-8 shadow-lg border-0">
              <p className="text-lg text-gray-700 italic mb-6">
                "ServEase transformed how we handle bookings. It's incredibly easy for our customers and saves us so much time!"
              </p>
              <div className="flex items-center justify-center">
                <img
                  src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEgzMFYzMEgyMFYyMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+"
                  alt="Client 1"
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <p className="font-semibold text-gray-900">Jane Doe</p>
                  <p className="text-sm text-gray-600">Owner, Jane's Salon</p>
                </div>
              </div>
            </Card>
            <Card className="p-8 shadow-lg border-0">
              <p className="text-lg text-gray-700 italic mb-6">
                "The digital menu is a game-changer. Our customers love the transparency and ease of booking."
              </p>
              <div className="flex items-center justify-center">
                <img
                  src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEgzMFYzMEgyMFYyMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+"
                  alt="Client 2"
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <p className="font-semibold text-gray-900">John Smith</p>
                  <p className="text-sm text-gray-600">Manager, Smith's Cafe</p>
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
            Ready to Grow Your Business?
          </h2>
          <p className="text-lg md:text-xl mb-10 opacity-90">
            Join ServEase today and revolutionize your service booking.
          </p>
          <Button 
            onClick={() => navigate('/register')}
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Get Started Today
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomeModern;