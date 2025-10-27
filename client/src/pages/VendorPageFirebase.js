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
  Search,
  BookOpen,
  Users,
  CheckCircle,
  X,
  Languages,
  Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase-config';
import { toast } from 'react-toastify';
import { translateWithFallback } from '../utils/translation';

const VendorPageFirebase = () => {
  const { vendorId, shortUrl } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  
  const [vendor, setVendor] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [displayLanguage, setDisplayLanguage] = useState('en');
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        setLoading(true);
        console.log('Fetching vendor data for:', vendorId || shortUrl);
        
        // Get vendor profile
        const vendorRef = doc(db, 'vendors', vendorId || shortUrl);
        const vendorSnap = await getDoc(vendorRef);
        
        if (!vendorSnap.exists()) {
          throw new Error('Vendor not found');
        }
        
        const vendorData = vendorSnap.data();
        console.log('Vendor data:', vendorData);
        
        // Check if vendor is active (default to true if not specified)
        if (vendorData.isActive === false) {
          throw new Error('Vendor is not active');
        }
        
        setVendor(vendorData);
        
        // Get vendor services (simplified query to avoid index requirement)
        const servicesRef = collection(db, 'services');
        const servicesQuery = query(
          servicesRef, 
          where('vendorId', '==', vendorId || shortUrl)
          // Removed isActive filter and orderBy to avoid composite index requirement
        );
        
        const servicesSnap = await getDocs(servicesQuery);
        const servicesData = servicesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(service => service.isActive === true) // Client-side filtering for active services
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Client-side sorting
        
        console.log('Services data:', servicesData);
        setServices(servicesData);
        
      } catch (error) {
        console.error('Error fetching vendor data:', error);
        setError(error.message || 'Vendor not found or inactive');
      } finally {
        setLoading(false);
      }
    };

    if (vendorId || shortUrl) {
      fetchVendorData();
    }
  }, [vendorId, shortUrl]);

  const handleBookService = (serviceId) => {
    navigate(`/booking/${vendorId || shortUrl}/${serviceId}`);
  };

  const handleBack = () => {
    // Don't navigate back to home - keep users in vendor context
    // This prevents customers from leaving the vendor page when they scan QR codes
    window.history.back();
  };

  // Translation functions
  const translateContent = async (targetLang) => {
    setTranslating(true);
    try {
      // Translate vendor business info
      if (vendor?.businessInfo?.name) {
        const translatedName = await translateWithFallback(vendor.businessInfo.name, targetLang);
        // Update display language
        setDisplayLanguage(targetLang);
        toast.success(`Content translated to ${targetLang === 'ms' ? 'Bahasa Malaysia' : targetLang === 'zh' ? 'Chinese' : 'English'}`);
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Translation failed. Please try again.');
    } finally {
      setTranslating(false);
    }
  };

  // Helper function to get translated text
  const getTranslatedText = (textObj, fallback = '') => {
    if (typeof textObj === 'string') return textObj;
    if (!textObj) return fallback;
    return textObj[displayLanguage] || textObj.en || textObj.ms || textObj.zh || fallback;
  };

  const filteredServices = services.filter(service => {
    // Handle multilingual name and description
    const serviceName = getTranslatedText(service.name, '');
    const serviceDescription = getTranslatedText(service.description, '');
    
    const matchesSearch = serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         serviceDescription.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(services.map(service => service.category))];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor information...</p>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Vendor Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This vendor is not available or has been deactivated.'}</p>
          <Button onClick={handleBack} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                {vendor.businessName || 'Business Profile'}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              {/* Language Selector */}
              <div className="flex items-center space-x-1 mr-4">
                <Languages className="w-4 h-4 text-gray-500" />
                <select
                  value={displayLanguage}
                  onChange={(e) => setDisplayLanguage(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="ms">Bahasa Malaysia</option>
                  <option value="zh">中文</option>
                </select>
                {displayLanguage !== 'en' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => translateContent(displayLanguage)}
                    disabled={translating}
                    className="ml-2"
                  >
                    {translating ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Languages className="w-3 h-3" />
                    )}
                  </Button>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/bookings')}>
                <Calendar className="w-4 h-4 mr-2" />
                Check Booking Status
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Heart className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Vendor Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600">
                      {vendor.businessName?.charAt(0) || 'B'}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-xl">{vendor.businessName}</CardTitle>
                    <p className="text-gray-600">{vendor.businessType}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {vendor.businessInfo?.description && (
                  <p className="text-gray-700">{vendor.businessInfo.description}</p>
                )}
                
                <div className="space-y-3">
                  {vendor.businessInfo?.address && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <span className="text-gray-700">{vendor.businessInfo.address}</span>
                    </div>
                  )}
                  
                  {vendor.contactInfo?.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">{vendor.contactInfo.phone}</span>
                    </div>
                  )}
                  
                  {vendor.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">{vendor.email}</span>
                    </div>
                  )}
                </div>

                {vendor.operatingHours && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-gray-900 mb-2">Operating Hours</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      {Object.entries(vendor.operatingHours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between">
                          <span className="capitalize">{day}</span>
                          <span>
                            {typeof hours === 'object' && hours !== null
                              ? hours.isOpen 
                                ? `${hours.open} - ${hours.close}`
                                : 'Closed'
                              : hours || 'Closed'
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Services Section */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Services</h2>
              
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search services..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Services Grid */}
            {filteredServices.length > 0 ? (
              <div className="grid gap-6">
                {filteredServices.map((service) => (
                  <Card key={service.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{getTranslatedText(service.name, service.name)}</CardTitle>
                          <p className="text-gray-600 mt-1">{service.category}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            ${service.price}
                          </div>
                          <div className="text-sm text-gray-500">
                            {service.duration} minutes
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4">{getTranslatedText(service.description, service.description)}</p>
                      
                      {service.features && service.features.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Features:</h4>
                          <ul className="space-y-1">
                            {service.features.map((feature, index) => (
                              <li key={index} className="flex items-center text-sm text-gray-600">
                                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {service.duration} min
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            Max {service.maxCapacity || 1} people
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleBookService(service.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Book Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
                <p className="text-gray-600">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'This vendor hasn\'t added any services yet.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPageFirebase;
