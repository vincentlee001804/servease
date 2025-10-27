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
    // Navigate back to the previous page in browser history
    // This ensures customers stay within the vendor context when they scan QR codes
    // and navigate back from booking pages or other vendor-related pages
    window.history.back();
  };

  const handleShare = async () => {
    try {
      const vendorUrl = window.location.href;
      
      // Try to use the Web Share API if available (mobile devices)
      if (navigator.share) {
        await navigator.share({
          title: `${vendor.businessName} - ServEase`,
          text: `Check out ${vendor.businessName} on ServEase`,
          url: vendorUrl,
        });
      } else {
        // Fallback to clipboard API
        await navigator.clipboard.writeText(vendorUrl);
        toast.success('Vendor link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = window.location.href;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success('Vendor link copied to clipboard!');
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
        toast.error('Failed to copy link. Please copy the URL manually.');
      }
    }
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
      <div className="bg-gray-50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900 truncate">
                    {vendor.businessName || 'Business Profile'}
                  </h1>
                </div>
                <div className="flex items-center gap-3 flex-wrap justify-center lg:justify-end">
                  {/* Language Selector */}
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border border-gray-200 min-w-0">
                    <Languages className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <select
                      value={displayLanguage}
                      onChange={(e) => setDisplayLanguage(e.target.value)}
                      className="text-sm font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 min-w-0"
                    >
                      <option value="en">English</option>
                      <option value="ms">Bahasa Malaysia</option>
                      <option value="zh">中文</option>
                    </select>
                    {displayLanguage !== 'en' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => translateContent(displayLanguage)}
                        disabled={translating}
                        className="ml-1 flex-shrink-0 p-1 h-6 w-6"
                      >
                        {translating ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Languages className="w-3 h-3" />
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {/* Bookings Button */}
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => navigate('/bookings')}>
                    <Calendar className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                      <span className="hidden sm:inline">Check Booking Status</span>
                      <span className="sm:hidden">Bookings</span>
                    </span>
                  </div>
                  
                  {/* Share Button */}
                  <div 
                    className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-900 whitespace-nowrap">Share</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Vendor Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-bold text-white">
                      {vendor.businessName?.charAt(0) || 'B'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl text-gray-900 mb-1">{vendor.businessName}</CardTitle>
                    <p className="text-gray-600 text-sm">{vendor.businessType}</p>
                    {vendor.businessInfo?.description && (
                      <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                        {vendor.businessInfo.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {vendor.businessInfo?.address && (
                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Address</p>
                        <span className="text-gray-700">{vendor.businessInfo.address}</span>
                      </div>
                    </div>
                  )}
                  
                  {vendor.contactInfo?.phone && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Phone</p>
                        <a href={`tel:${vendor.contactInfo.phone}`} className="text-blue-600 hover:text-blue-800 font-medium">
                          {vendor.contactInfo.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {vendor.email && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-purple-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Email</p>
                        <a href={`mailto:${vendor.email}`} className="text-blue-600 hover:text-blue-800 font-medium">
                          {vendor.email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {vendor.operatingHours && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-500" />
                      Operating Hours
                    </h4>
                    <div className="space-y-2 text-sm">
                      {(() => {
                        // Define the order of days starting from Monday
                        const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                        const sortedDays = dayOrder.filter(day => vendor.operatingHours[day]);
                        
                        return sortedDays.map((day) => {
                          const hours = vendor.operatingHours[day];
                          const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === day;
                          
                          return (
                            <div key={day} className={`flex justify-between items-center py-1 px-2 rounded-md ${isToday ? 'bg-blue-50 border border-blue-200' : ''}`}>
                              <span className={`capitalize font-medium ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                                {day}
                                {isToday && <span className="ml-2 text-xs text-blue-600">(Today)</span>}
                              </span>
                              <span className={`font-medium ${isToday ? 'text-blue-700' : 'text-gray-600'}`}>
                                {typeof hours === 'object' && hours !== null
                                  ? hours.isOpen 
                                    ? `${hours.open} - ${hours.close}`
                                    : 'Closed'
                                  : hours || 'Closed'
                                }
                              </span>
                            </div>
                          );
                        });
                      })()}
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
