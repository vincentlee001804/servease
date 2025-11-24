import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18next from '../config/i18n';
import { getLanguageName } from '../config/i18n';
import { 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  ArrowLeft,
  Share2,
  Search,
  BookOpen,
  Users,
  CheckCircle,
  X,
  Languages
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { toast } from 'react-toastify';

const VendorPageFirebase = () => {
  const { vendorId, shortUrl, lang } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, ready } = useTranslation('common');
  
  const [vendor, setVendor] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  
  // Sync i18next language with URL language changes
  useEffect(() => {
    if (lang && i18next.language !== lang) {
      i18next.changeLanguage(lang);
    }
  }, [lang]);

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
    navigate(`/${lang}/booking/${vendorId || shortUrl}/${serviceId}`);
  };

  const handleBack = () => {
    // Navigate back to the previous page in browser history
    // This ensures customers stay within the vendor context when they scan QR codes
    // and navigate back from booking pages or other vendor-related pages
    window.history.back();
  };

  // Handle language change - navigate to new language URL
  const handleLanguageChange = (newLang) => {
    // Get current path without language prefix
    const currentPath = location.pathname.replace(/^\/(en|bm|jtzw)/, '');
    // Construct new path with new language
    const newPath = `/${newLang}${currentPath}`;
    navigate(newPath);
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
        toast.success(t('vendorPage.linkCopied'));
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
        toast.success(t('vendorPage.linkCopied'));
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
        toast.error(t('vendorPage.copyFailed'));
      }
    }
  };

  // Helper function to get translated text (for vendor content like service names/descriptions)
  const getTranslatedText = (textObj, fallback = '') => {
    if (typeof textObj === 'string') return textObj;
    if (!textObj) return fallback;
    // Map URL language codes to legacy keys for vendor content translation
    const langMap = { 'en': 'en', 'bm': 'ms', 'jtzw': 'zh' };
    const mappedLang = langMap[lang] || 'en';
    return textObj[mappedLang] || textObj.en || textObj.ms || textObj.zh || fallback;
  };

  // Helper function to translate day names
  const translateDay = (dayKey) => {
    return t(`vendorPage.days.${dayKey}`);
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

  // Wait for translations to be ready
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('vendorPage.loading')}</p>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('vendorPage.notFound')}</h1>
          <p className="text-gray-600 mb-6">{error || t('vendorPage.notAvailable')}</p>
          <Button onClick={handleBack} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('vendorPage.goBack')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Image Section - Smaller on Mobile */}
      {vendor?.coverImageUrl && (
        <div className="w-full h-40 sm:h-56 lg:h-64 bg-gradient-to-r from-blue-500 to-purple-600 relative overflow-hidden">
          <img 
            src={vendor.coverImageUrl} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        </div>
      )}
      
      {/* Compact Header - Mobile Optimized */}
      <div className={`bg-white border-b border-gray-200 sticky top-0 z-10 ${vendor?.coverImageUrl ? '' : 'lg:static'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Vendor Name with Profile Image */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 overflow-hidden border-2 border-white shadow-md flex items-center justify-center flex-shrink-0">
                {vendor?.profileImageUrl ? (
                  <img 
                    src={vendor.profileImageUrl} 
                    alt={vendor.businessName} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg sm:text-xl font-bold text-white">
                    {vendor.businessName?.charAt(0) || 'B'}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  {vendor.businessName || 'Business Profile'}
                </h1>
                <p className="text-xs text-gray-500 truncate">{vendor.businessType}</p>
              </div>
            </div>
            
            {/* Action Buttons - Compact on Mobile */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Language Selector - Clickable Button */}
              <div className="relative">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 h-9 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors flex-shrink-0 min-w-[60px] sm:min-w-0"
                >
                  <Languages className="w-4 h-4 text-blue-500 flex-shrink-0"/>
                  <span className="text-xs sm:text-sm font-medium text-gray-900 hidden sm:inline">
                    {getLanguageName(lang || 'en')}
                  </span>
                  <span className="text-xs font-medium text-gray-900 sm:hidden">
                    {lang?.toUpperCase() || 'EN'}
                  </span>
                </button>
                
                {/* Language Dropdown Menu */}
                {showLanguageMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-20" 
                      onClick={() => setShowLanguageMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30">
                      <button
                        onClick={() => {
                          handleLanguageChange('en');
                          setShowLanguageMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                          lang === 'en' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <Languages className="w-4 h-4" />
                        {getLanguageName('en')}
                      </button>
                      <button
                        onClick={() => {
                          handleLanguageChange('bm');
                          setShowLanguageMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                          lang === 'bm' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <Languages className="w-4 h-4" />
                        {getLanguageName('bm')}
                      </button>
                      <button
                        onClick={() => {
                          handleLanguageChange('jtzw');
                          setShowLanguageMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                          lang === 'jtzw' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <Languages className="w-4 h-4" />
                        {getLanguageName('jtzw')}
                      </button>
                    </div>
                  </>
                )}
              </div>
              
              {/* Bookings Button - Icon Only on Mobile */}
              <button 
                className="inline-flex items-center justify-center w-9 h-9 sm:px-3 sm:py-1.5 sm:w-auto bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors flex-shrink-0"
                onClick={() => navigate(`/${lang}/bookings`)}
                title={t('vendorPage.bookingStatus')}
              >
                <Calendar className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900 whitespace-nowrap hidden sm:inline ml-2">{t('vendorPage.bookingStatus')}</span>
              </button>
              
              {/* Share Button */}
              <button 
                className="inline-flex items-center justify-center w-9 h-9 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors flex-shrink-0"
                onClick={handleShare}
                aria-label="Share vendor"
              >
                <Share2 className="w-4 h-4 text-purple-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Vendor Info Sidebar - Hidden on Mobile (info shown in header) */}
          <div className="lg:col-span-1 hidden lg:block">
            <Card className="sticky top-20">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden border-2 border-white">
                    {vendor.profileImageUrl ? (
                      <img 
                        src={vendor.profileImageUrl} 
                        alt={vendor.businessName} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-white">
                        {vendor.businessName?.charAt(0) || 'B'}
                      </span>
                    )}
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
                        <p className="text-sm font-medium text-gray-900 mb-1">{t('vendorPage.address')}</p>
                        <span className="text-gray-700">{vendor.businessInfo.address}</span>
                      </div>
                    </div>
                  )}
                  
                  {vendor.contactInfo?.phone && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">{t('vendorPage.phone')}</p>
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
                        <p className="text-sm font-medium text-gray-900 mb-1">{t('vendorPage.email')}</p>
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
                      {t('vendorPage.operatingHours')}
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
                                {translateDay(day)}
                                {isToday && <span className="ml-2 text-xs text-blue-600">({t('vendorPage.today')})</span>}
                              </span>
                              <span className={`font-medium ${isToday ? 'text-blue-700' : 'text-gray-600'}`}>
                                {typeof hours === 'object' && hours !== null
                                  ? hours.isOpen 
                                    ? `${hours.open} - ${hours.close}`
                                    : t('vendorPage.closed')
                                  : hours || t('vendorPage.closed')
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

          {/* Services Section - Full Width on Mobile */}
          <div className="lg:col-span-2">
            <div className="mb-4 lg:mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 lg:mb-4">{t('vendorPage.availableServices')}</h2>
              
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder={t('vendorPage.searchServices')}
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
                      {category === 'all' ? t('vendorPage.allCategories') : category.charAt(0).toUpperCase() + category.slice(1)}
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
                          <div className="text-sm uppercase tracking-wide text-gray-500">
                            {service.priceType === 'range' || service.priceType === 'from' ? t('vendorPage.priceFrom') : t('vendorPage.price')}
                          </div>
                          <div className="text-2xl font-bold text-blue-600">
                            {t('vendorPage.priceCurrency', {
                              price: service.priceRange?.min || service.price
                            })}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4">{getTranslatedText(service.description, service.description)}</p>
                      
                      {service.features && service.features.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">{t('vendorPage.features')}</h4>
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
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {service.duration} {t('vendorPage.minutes')}
                        </div>
                        <Button 
                          onClick={() => handleBookService(service.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          {t('vendorPage.bookNow')}
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('vendorPage.noServicesFound')}</h3>
                <p className="text-gray-600">
                  {searchTerm || selectedCategory !== 'all' 
                    ? t('vendorPage.adjustSearch')
                    : t('vendorPage.noServicesAdded')
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
