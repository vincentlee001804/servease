import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Star, 
  ArrowLeft,
  Heart,
  Share2,
  Filter,
  Search
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import axios from '../config/axios';

const VendorPageFoodApp = () => {
  const { vendorId, shortUrl } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  
  const [vendor, setVendor] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        setLoading(true);
        const identifier = vendorId || shortUrl;
        const response = await axios.get(`/api/vendors/public/${identifier}`);
        
        setVendor(response.data.vendor);
        setServices(response.data.services);
      } catch (error) {
        console.error('Error fetching vendor data:', error);
        setError('Vendor not found or inactive');
      } finally {
        setLoading(false);
      }
    };

    const identifier = vendorId || shortUrl;
    if (identifier) {
      fetchVendorData();
    }
  }, [vendorId, shortUrl]);

  const handleBookNow = (service) => {
    navigate(`/booking/${vendor._id}`, { 
      state: { 
        vendor, 
        selectedService: service,
        services 
      } 
    });
  };

  const formatPrice = (price, priceType, priceRange) => {
    switch (priceType) {
      case 'range':
        return `RM ${priceRange?.min || price} - RM ${priceRange?.max || price}`;
      case 'from':
        return `From RM ${price}`;
      default:
        return `RM ${price}`;
    }
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name[language]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description[language]?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(services.map(s => s.category))];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Vendor Not Found</h1>
          <p className="text-gray-600 mb-6">The vendor you're looking for doesn't exist or is inactive.</p>
          <Button onClick={() => navigate('/')} className="w-full">
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Heart className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Header */}
      <div className="bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Vendor Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {vendor.businessName}
                </h1>
                <div className="flex items-center space-x-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600">4.8</span>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4">
                {vendor.description}
              </p>
              
              {/* Contact Info */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {vendor.contactInfo.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <a 
                      href={`tel:${vendor.contactInfo.phone}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {vendor.contactInfo.phone}
                    </a>
                  </div>
                )}
                {vendor.contactInfo.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <a 
                      href={`mailto:${vendor.contactInfo.email}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {vendor.contactInfo.email}
                    </a>
                  </div>
                )}
                {vendor.contactInfo.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {vendor.contactInfo.address.street}, {vendor.contactInfo.address.city}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Operating Hours */}
            <Card className="min-w-64">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Operating Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {Object.entries(vendor.operatingHours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between">
                      <span className="capitalize font-medium">{day}:</span>
                      <span className={hours.isOpen ? 'text-gray-900' : 'text-gray-500'}>
                        {hours.isOpen ? `${hours.open} - ${hours.close}` : 'Closed'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category === 'all' ? 'All' : category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {t('services')}
          </h2>
          <div className="text-sm text-gray-600">
            {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} available
          </div>
        </div>

        {filteredServices.length === 0 ? (
          <Card className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Services Found
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : 'This vendor hasn\'t added any services yet.'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card key={service.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {service.name[language] || service.name.en}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(service.duration)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-600">
                        {formatPrice(service.price, service.priceType, service.priceRange)}
                      </div>
                    </div>
                  </div>

                  {service.description && (
                    <p className="text-gray-600 mb-4 text-sm line-clamp-2">
                      {service.description[language] || service.description.en}
                    </p>
                  )}

                  {service.requirements && service.requirements.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-medium text-gray-500 mb-2">Requirements:</div>
                      <div className="flex flex-wrap gap-1">
                        {service.requirements.slice(0, 2).map((req, index) => (
                          <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {req}
                          </span>
                        ))}
                        {service.requirements.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{service.requirements.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={() => handleBookNow(service)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {t('bookNow')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorPageFoodApp;
