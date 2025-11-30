import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18next from '../config/i18n';
import { changeLanguage } from '../config/i18n';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { CheckCircle, Calendar, CalendarPlus, Clock, User, Phone, Mail, MapPin, ArrowLeft, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://us-central1-servease-07762363-b4f31.cloudfunctions.net/api'
  : 'http://localhost:8000';

const BookingSuccess = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const { t, i18n } = useTranslation('common');
  
  // Extract language from URL path
  const pathLang = location.pathname.split('/').filter(Boolean)[0] || 'en';
  
  // Sync language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('user_language_preference');
    if (savedLanguage) {
      if (i18next.language !== savedLanguage) {
        changeLanguage(savedLanguage);
      }
    } else if (pathLang && i18next.language !== pathLang) {
      i18next.changeLanguage(pathLang);
    }
  }, [pathLang]);
  
  const [vendor, setVendor] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatPriceFromBooking = (b) => {
    if (!b) return 'RM 0';
    if (b.servicePriceType === 'fixed') {
      return `RM ${b.servicePrice ?? b.price ?? 0}`;
    }
    if (b.servicePriceType === 'range') {
      const min = b.servicePriceRange?.min ?? 0;
      const max = b.servicePriceRange?.max ?? 0;
      return `RM ${min} - ${max}`;
    }
    if (b.servicePriceType === 'from') {
      return `From RM ${b.servicePrice ?? b.price ?? 0}`;
    }
    return `RM ${b.price ?? 0}`;
  };

  const handleAddToCalendar = () => {
    if (!booking || !booking.confirmationCode || !bookingId) return;
    const calendarUrl = `${API_BASE_URL}/bookings/${bookingId}/ics?code=${encodeURIComponent(
      booking.confirmationCode
    )}`;
    window.open(calendarUrl, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    } else {
      setLoading(false);
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch booking details
      const bookingRef = doc(db, 'bookings', bookingId);
      const bookingSnap = await getDoc(bookingRef);
      
      if (bookingSnap.exists()) {
        const bookingData = bookingSnap.data();
        setBooking({ id: bookingSnap.id, ...bookingData });
        
        // Fetch vendor details
        const vendorRef = doc(db, 'vendors', vendorId);
        const vendorSnap = await getDoc(vendorRef);
        
        if (vendorSnap.exists()) {
          const vendorData = vendorSnap.data();
          setVendor({ id: vendorSnap.id, ...vendorData });
        }
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateInput) => {
    if (!dateInput) return '';
    
    // Handle Firestore Timestamp
    let date;
    if (dateInput.toDate) {
      date = dateInput.toDate();
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else {
      date = new Date(dateInput);
    }
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const currentLang = i18n.language || 'en';
    
    // For Chinese (jtzw), use DD/MM/YYYY format
    if (currentLang === 'jtzw') {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    
    // For other languages, use locale-specific format
    const localeMap = {
      'en': 'en-US',
      'bm': 'ms-MY',
      'jtzw': 'zh-CN'
    };
    
    const locale = localeMap[currentLang] || 'en-US';
    return date.toLocaleDateString(locale, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    
    const currentLang = i18n.language || 'en';
    const localeMap = {
      'en': 'en-US',
      'bm': 'ms-MY',
      'jtzw': 'zh-CN'
    };
    
    const locale = localeMap[currentLang] || 'en-US';
    return date.toLocaleTimeString(locale, { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('bookingSuccess.title')}</h1>
          <p className="text-gray-600">
            {t('bookingSuccess.subtitle')}
          </p>
        </div>

        {/* Booking Details */}
        {booking && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                {t('bookingSuccess.bookingDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">{booking.serviceName}</h3>
                  <p className="text-sm text-gray-600">{t('bookingSuccess.service')}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{formatPriceFromBooking(booking)}</h3>
                  <p className="text-sm text-gray-600">{t('bookingSuccess.estimatedPrice')}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <div>
                    <p className="font-medium">{formatDate(booking.bookingDate)}</p>
                    <p className="text-sm text-gray-600">{t('bookingSuccess.date')}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <div>
                    <p className="font-medium">{formatTime(booking.bookingTime)}</p>
                    <p className="text-sm text-gray-600">{t('bookingSuccess.time')}</p>
                  </div>
                </div>
              </div>

              {booking.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">{t('bookingSuccess.specialNotes')}</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{booking.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Customer Details */}
        {booking && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                {t('bookingSuccess.yourDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-3 text-gray-500" />
                <div>
                  <p className="font-medium">{booking.customerName}</p>
                  <p className="text-sm text-gray-600">{t('bookingSuccess.fullName')}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-3 text-gray-500" />
                <div>
                  <p className="font-medium">{booking.customerEmail}</p>
                  <p className="text-sm text-gray-600">{t('bookingSuccess.emailAddress')}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-3 text-gray-500" />
                <div>
                  <p className="font-medium">{booking.customerPhone}</p>
                  <p className="text-sm text-gray-600">{t('bookingSuccess.phoneNumber')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vendor Information */}
        {vendor && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                {t('bookingSuccess.vendorInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-medium text-gray-900">{vendor.businessName}</h3>
                <p className="text-sm text-gray-600">{t('bookingSuccess.businessName')}</p>
              </div>
              {vendor.businessInfo?.address && (
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-3 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium">{vendor.businessInfo.address}</p>
                    <p className="text-sm text-gray-600">{t('bookingSuccess.address')}</p>
                  </div>
                </div>
              )}
              {vendor.contactInfo?.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-3 text-gray-500" />
                  <div>
                    <p className="font-medium">{vendor.contactInfo.phone}</p>
                    <p className="text-sm text-gray-600">{t('bookingSuccess.phone')}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Status Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('bookingSuccess.whatsNext')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">1</span>
                </div>
                <div>
                  <p className="font-medium">{t('bookingSuccess.bookingSubmitted')}</p>
                  <p className="text-sm text-gray-600">{t('bookingSuccess.bookingSubmittedDesc')}</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-medium text-gray-600">2</span>
                </div>
                <div>
                  <p className="font-medium">{t('bookingSuccess.vendorConfirmation')}</p>
                  <p className="text-sm text-gray-600">{t('bookingSuccess.vendorConfirmationDesc')}</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-medium text-gray-600">3</span>
                </div>
                <div>
                  <p className="font-medium">{t('bookingSuccess.serviceDelivery')}</p>
                  <p className="text-sm text-gray-600">{t('bookingSuccess.serviceDeliveryDesc')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => navigate(`/${pathLang}/vendor/${vendorId}`)}
            variant="outline"
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('bookingSuccess.backToServices')}
          </Button>
          <Button 
            onClick={() => navigate(`/${pathLang}/bookings`)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            {t('bookingSuccess.viewAllBookings')}
          </Button>
          {booking && booking.confirmationCode && (
            <Button 
              onClick={handleAddToCalendar}
              variant="secondary"
              className="flex-1"
            >
              <CalendarPlus className="h-4 w-4 mr-2" />
              {t('bookingSuccess.addToCalendar')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
