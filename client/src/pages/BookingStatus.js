import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18next from '../config/i18n';
import { changeLanguage } from '../config/i18n';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { toast } from 'react-toastify';
import { Calendar, Clock, User, Phone, Mail, MapPin, ArrowLeft, CheckCircle, XCircle, AlertCircle, Eye, RotateCw, Building2, CalendarPlus, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://us-central1-servease-07762363-b4f31.cloudfunctions.net/api'
  : 'http://localhost:8000';

const BookingStatus = () => {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customerIdentifier, setCustomerIdentifier] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [searchType, setSearchType] = useState(null); // 'email' or 'phone'
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Sync language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('user_language_preference');
    if (savedLanguage) {
      // Use saved language preference
      if (i18next.language !== savedLanguage) {
        changeLanguage(savedLanguage);
      }
    }
  }, []);

  useEffect(() => {
    // Always start with empty identifier field
    // Do NOT pre-fill from localStorage to ensure users enter their own email/phone
    // User must explicitly enter their email or phone and click "View My Bookings"
    setCustomerIdentifier('');
    setSearchType(null);
  }, []);

  // Helper function to detect if input is email or phone
  const detectInputType = (input) => {
    if (!input) return null;
    const trimmed = input.trim();
    // Check if it looks like an email (contains @)
    if (trimmed.includes('@')) {
      return 'email';
    }
    // Check if it's mostly digits (phone number)
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (digitsOnly.length >= 8) {
      return 'phone';
    }
    // Default to email if ambiguous
    return 'email';
  };

  const fetchBookings = async (identifier, type) => {
    try {
      console.log('Fetching bookings for:', type, identifier);
      setLoading(true);
      
      let bookingsQuery;
      
      if (type === 'phone') {
        // Search by phone number
        bookingsQuery = query(
          collection(db, 'bookings'),
          where('customerPhone', '==', identifier)
        );
      } else {
        // Search by email (default)
        bookingsQuery = query(
          collection(db, 'bookings'),
          where('customerEmail', '==', identifier)
        );
      }
      
      const querySnapshot = await getDocs(bookingsQuery);
      const bookingsData = [];
      
      querySnapshot.forEach((doc) => {
        bookingsData.push({ id: doc.id, ...doc.data() });
      });
      
      // Fetch vendor information for each booking to display vendor name
      const bookingsWithVendorInfo = await Promise.all(
        bookingsData.map(async (booking) => {
          if (booking.vendorId) {
            try {
              const vendorRef = doc(db, 'vendors', booking.vendorId);
              const vendorDoc = await getDoc(vendorRef);
              if (vendorDoc.exists()) {
                const vendorData = vendorDoc.data();
                return {
                  ...booking,
                  vendorName: vendorData.businessName || 'Vendor',
                  vendorBusinessType: vendorData.businessType || ''
                };
              }
            } catch (error) {
              console.error('Error fetching vendor info:', error);
            }
          }
          return {
            ...booking,
            vendorName: 'Vendor',
            vendorBusinessType: ''
          };
        })
      );
      
      // Replace bookingsData with enriched data
      bookingsData.length = 0;
      bookingsData.push(...bookingsWithVendorInfo);
      
      // If no results found with one method, try the other method
      if (bookingsData.length === 0 && type === 'email') {
        console.log('No bookings found with email, trying phone number...');
        const phoneQuery = query(
          collection(db, 'bookings'),
          where('customerPhone', '==', identifier)
        );
        const phoneSnapshot = await getDocs(phoneQuery);
        phoneSnapshot.forEach((doc) => {
          bookingsData.push({ id: doc.id, ...doc.data() });
        });
        if (bookingsData.length > 0) {
          setSearchType('phone');
          // Fetch vendor information for fallback results
          const bookingsWithVendorInfo = await Promise.all(
            bookingsData.map(async (booking) => {
              if (booking.vendorId) {
                try {
                  const vendorRef = doc(db, 'vendors', booking.vendorId);
                  const vendorDoc = await getDoc(vendorRef);
                  if (vendorDoc.exists()) {
                    const vendorData = vendorDoc.data();
                    return {
                      ...booking,
                      vendorName: vendorData.businessName || 'Vendor',
                      vendorBusinessType: vendorData.businessType || ''
                    };
                  }
                } catch (error) {
                  console.error('Error fetching vendor info:', error);
                }
              }
              return {
                ...booking,
                vendorName: 'Vendor',
                vendorBusinessType: ''
              };
            })
          );
          bookingsData.length = 0;
          bookingsData.push(...bookingsWithVendorInfo);
        }
      } else if (bookingsData.length === 0 && type === 'phone') {
        console.log('No bookings found with phone, trying email...');
        const emailQuery = query(
          collection(db, 'bookings'),
          where('customerEmail', '==', identifier)
        );
        const emailSnapshot = await getDocs(emailQuery);
        emailSnapshot.forEach((doc) => {
          bookingsData.push({ id: doc.id, ...doc.data() });
        });
        if (bookingsData.length > 0) {
          setSearchType('email');
          // Fetch vendor information for fallback results
          const bookingsWithVendorInfo = await Promise.all(
            bookingsData.map(async (booking) => {
              if (booking.vendorId) {
                try {
                  const vendorRef = doc(db, 'vendors', booking.vendorId);
                  const vendorDoc = await getDoc(vendorRef);
                  if (vendorDoc.exists()) {
                    const vendorData = vendorDoc.data();
                    return {
                      ...booking,
                      vendorName: vendorData.businessName || 'Vendor',
                      vendorBusinessType: vendorData.businessType || ''
                    };
                  }
                } catch (error) {
                  console.error('Error fetching vendor info:', error);
                }
              }
              return {
                ...booking,
                vendorName: 'Vendor',
                vendorBusinessType: ''
              };
            })
          );
          bookingsData.length = 0;
          bookingsData.push(...bookingsWithVendorInfo);
        }
      } else {
        setSearchType(type);
      }
      
      // Helper function to get booking date/time for sorting
      const getBookingDateTime = (booking) => {
        // Create a Date object from bookingDate and bookingTime
        const bookingDate = booking.bookingDate;
        const bookingTime = booking.bookingTime;
        
        let bookingDateTime;
        if (bookingDate) {
          if (bookingDate instanceof Date) {
            bookingDateTime = new Date(bookingDate);
          } else if (bookingDate.toDate) {
            // Firestore Timestamp
            bookingDateTime = bookingDate.toDate();
          } else {
            // String date
            bookingDateTime = new Date(bookingDate);
          }
          
          // If bookingTime exists, combine it with the date
          if (bookingTime) {
            const [hours, minutes] = bookingTime.split(':');
            if (hours && minutes) {
              bookingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            }
          } else {
            // Default to start of day if no time
            bookingDateTime.setHours(0, 0, 0, 0);
          }
        } else {
          // Fallback to createdAt if no bookingDate
          bookingDateTime = booking.createdAt?.toDate?.() || new Date(booking.createdAt || 0);
        }
        
        return bookingDateTime;
      };

      // Separate bookings by status (same as vendor dashboard)
      const confirmedBookings = bookingsData.filter(b => b.status === 'confirmed');
      const completedBookings = bookingsData.filter(b => b.status === 'completed');
      const pendingBookings = bookingsData.filter(b => b.status === 'pending');
      const cancelledBookings = bookingsData.filter(b => b.status === 'cancelled');

      // Sort confirmed bookings by booking date (nearest first - ascending)
      confirmedBookings.sort((a, b) => {
        const dateA = getBookingDateTime(a);
        const dateB = getBookingDateTime(b);
        return dateA.getTime() - dateB.getTime();
      });

      // Sort pending bookings by booking date (nearest first - ascending)
      pendingBookings.sort((a, b) => {
        const dateA = getBookingDateTime(a);
        const dateB = getBookingDateTime(b);
        return dateA.getTime() - dateB.getTime();
      });

      // Sort completed bookings by booking date (most recent first - descending)
      completedBookings.sort((a, b) => {
        const dateA = getBookingDateTime(a);
        const dateB = getBookingDateTime(b);
        return dateB.getTime() - dateA.getTime();
      });

      // Sort cancelled bookings by booking date (most recent first - descending)
      cancelledBookings.sort((a, b) => {
        const dateA = getBookingDateTime(a);
        const dateB = getBookingDateTime(b);
        return dateB.getTime() - dateA.getTime();
      });

      // Combine: Confirmed (nearest first) -> Pending (nearest first) -> Completed (most recent first) -> Cancelled (most recent first)
      const sortedBookings = [...confirmedBookings, ...pendingBookings, ...completedBookings, ...cancelledBookings];
      
      console.log('Found bookings:', sortedBookings.length, `(Confirmed: ${confirmedBookings.length}, Pending: ${pendingBookings.length}, Completed: ${completedBookings.length}, Cancelled: ${cancelledBookings.length})`);
      setBookings(sortedBookings);
      setHasSearched(true); // Set hasSearched to true after search completes
      
      if (bookingsData.length === 0) {
        console.log('No bookings found for:', type, identifier);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setHasSearched(true); // Set hasSearched to true even on error
      
      // Show user-friendly error message
      if (error.code === 'failed-precondition') {
        console.error('Firebase index error - this should be fixed now');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleIdentifierSubmit = (e) => {
    e.preventDefault();
    if (customerIdentifier) {
      const trimmed = customerIdentifier.trim();
      const detectedType = detectInputType(trimmed);
      
      // Store in localStorage for convenience
      if (detectedType === 'email') {
        localStorage.setItem('customerEmail', trimmed);
      } else {
        localStorage.setItem('customerPhone', trimmed);
      }
      
      setHasSearched(true);
      setSearchType(detectedType);
      fetchBookings(trimmed, detectedType);
    }
  };

  const handleBackNavigation = () => {
    // Extract language from current URL path
    const pathLang = location.pathname.split('/').filter(Boolean)[0] || 'en';
    
    // Check if we came from a vendor page
    const referrer = document.referrer;
    if (referrer && referrer.includes('/vendor/')) {
      // Extract vendor ID from referrer URL
      const vendorIdMatch = referrer.match(/\/vendor\/([^\/\?]+)/);
      if (vendorIdMatch) {
        navigate(`/${pathLang}/vendor/${vendorIdMatch[1]}`);
        return;
      }
    }
    
    // Check if there's a vendor ID in the bookings
    if (bookings.length > 0 && bookings[0].vendorId) {
      navigate(`/${pathLang}/vendor/${bookings[0].vendorId}`);
      return;
    }
    
    // Fallback to browser back
    navigate(-1);
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
      // Handle string dates like "2025-11-28"
      date = new Date(dateInput);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        // Try parsing as YYYY-MM-DD format
        const parts = dateInput.split('-');
        if (parts.length === 3) {
          date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
      }
    } else {
      date = new Date(dateInput);
    }
    
    // Check if date is valid
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
      year: 'numeric', 
      month: 'short', 
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

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    let date;
    if (timestamp.toDate) {
      // Firestore Timestamp
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      date = new Date(timestamp);
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
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
    
    // For other languages, use locale-specific format
    const localeMap = {
      'en': 'en-US',
      'bm': 'ms-MY',
      'jtzw': 'zh-CN'
    };
    
    const locale = localeMap[currentLang] || 'en-US';
    return date.toLocaleString(locale, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Handle add to calendar
  const handleAddToCalendar = (booking) => {
    if (!booking || !booking.id) {
      toast.error(t('bookingStatus.calendarError'));
      return;
    }

    // If confirmationCode exists, use the API endpoint
    if (booking.confirmationCode) {
      const calendarUrl = `${API_BASE_URL}/bookings/${booking.id}/ics?code=${encodeURIComponent(
        booking.confirmationCode
      )}`;
      window.open(calendarUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // Otherwise, create calendar event client-side
    try {
      // Get booking date and time
      let startDate;
      if (booking.bookingDate) {
        let date;
        if (booking.bookingDate.toDate) {
          date = booking.bookingDate.toDate();
        } else if (booking.bookingDate instanceof Date) {
          date = booking.bookingDate;
        } else {
          date = new Date(booking.bookingDate);
        }

        // Set time if bookingTime exists
        if (booking.bookingTime) {
          const [hours, minutes] = booking.bookingTime.split(':');
          date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        } else {
          date.setHours(9, 0, 0, 0); // Default to 9 AM
        }
        startDate = date;
      } else {
        startDate = new Date();
      }

      // Calculate end date (default 1 hour duration)
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

      // Format dates for ICS
      const formatICSDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const escapeICSText = (text = '') => {
        return String(text)
          .replace(/\\/g, '\\\\')
          .replace(/;/g, '\\;')
          .replace(/,/g, '\\,')
          .replace(/\n/g, '\\n');
      };

      const summary = `ServEase Booking - ${booking.serviceName || 'Service'}`;
      const location = booking.vendorName || '';
      const description = [
        `Vendor: ${booking.vendorName || ''}`,
        `Customer: ${booking.customerName || ''}`,
        booking.notes ? `Notes: ${booking.notes}` : '',
        `Price: ${formatPrice(booking)}`
      ].filter(Boolean).join('\\n');

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//ServEase//Calendar//EN',
        'BEGIN:VEVENT',
        `UID:${booking.id}@servease`,
        `DTSTAMP:${formatICSDate(new Date())}`,
        `DTSTART:${formatICSDate(startDate)}`,
        `DTEND:${formatICSDate(endDate)}`,
        `SUMMARY:${escapeICSText(summary)}`,
        location ? `LOCATION:${escapeICSText(location)}` : '',
        `DESCRIPTION:${escapeICSText(description)}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
      ]
        .filter(Boolean)
        .join('\r\n');

      // Create blob and download
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `servease-booking-${booking.id}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error creating calendar event:', error);
      toast.error(t('bookingStatus.calendarError'));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatPrice = (booking) => {
    // Check if booking has pricing method information
    if (booking.priceType) {
      switch (booking.priceType) {
        case 'fixed':
          return `RM ${booking.price}`;
        case 'range':
          return `RM ${booking.priceRange?.min || booking.price} - ${booking.priceRange?.max || booking.price}`;
        case 'from':
          return `Starting from RM ${booking.price}`;
        default:
          return `RM ${booking.price}`;
      }
    }
    
    // Fallback to simple price display
    return `RM ${booking.price}`;
  };

  // Handler for Cancel button
  const handleCancelBooking = async (booking) => {
    const confirmed = window.confirm(t('bookingStatus.cancelConfirm'));
    if (!confirmed) {
      return;
    }

    try {
      const bookingRef = doc(db, 'bookings', booking.id);
      await updateDoc(bookingRef, {
        status: 'cancelled',
        updatedAt: new Date()
      });
      
      // Update local state
      setBookings(prevBookings => 
        prevBookings.map(b => 
          b.id === booking.id ? { ...b, status: 'cancelled' } : b
        )
      );
      
      toast.success(t('bookingStatus.cancelSuccess'));
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(t('bookingStatus.cancelError'));
    }
  };

  // Handler for Reschedule button
  const handleRescheduleBooking = (booking) => {
    // Extract language from current URL path
    const pathLang = location.pathname.split('/').filter(Boolean)[0] || 'en';
    
    // Navigate to booking page with booking data in state for pre-filling
    navigate(`/${pathLang}/booking/${booking.vendorId}/${booking.serviceId}`, {
      state: {
        bookingId: booking.id,
        bookingData: {
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          customerPhone: booking.customerPhone,
          selectedDate: booking.bookingDate,
          selectedTime: booking.bookingTime,
          notes: booking.notes
        },
        isReschedule: true
      }
    });
  };

  // Handler for Reorder button
  const handleReorderBooking = (booking) => {
    // Extract language from current URL path
    const pathLang = location.pathname.split('/').filter(Boolean)[0] || 'en';
    
    // Navigate to booking page with customer data pre-filled for reordering
    navigate(`/${pathLang}/booking/${booking.vendorId}/${booking.serviceId}`, {
      state: {
        bookingData: {
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          customerPhone: booking.customerPhone,
          notes: booking.notes || ''
        },
        isReorder: true
      }
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
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4">
        {/* Email Input Form - Centered */}
        {!hasSearched && (
          <div className="relative">
            {/* Back Button - Top Left */}
            <div className="absolute top-6 left-0">
              <button
              onClick={handleBackNavigation}
                className="flex items-center text-gray-500 hover:text-gray-700 text-sm transition-colors"
            >
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t('bookingStatus.back')}
              </button>
            </div>
            
            <div className="flex flex-col justify-center h-[80vh] max-w-md mx-auto">

            {/* Illustration */}
            <div className="mb-8 flex justify-center">
              <svg className="w-48 h-48 text-blue-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
          </div>
          
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('bookingStatus.title')}</h1>
              <p className="text-base text-gray-600">{t('bookingStatus.subtitle')}</p>
        </div>

            {/* Form */}
              <form onSubmit={handleIdentifierSubmit} className="space-y-6">
              {/* Floating Label Input */}
              <div className="relative">
                  <input
                    type="text"
                  id="customerIdentifier"
                    value={customerIdentifier}
                    onChange={(e) => setCustomerIdentifier(e.target.value)}
                  className="peer w-full px-4 pt-6 pb-2 text-lg border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                  placeholder=" "
                    required
                  />
                <label
                  htmlFor="customerIdentifier"
                  className={`absolute left-4 transition-all duration-200 ${
                    customerIdentifier 
                      ? 'top-2 text-sm text-blue-600 font-medium' 
                      : 'top-4 text-base text-gray-500 peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-600 peer-focus:font-medium'
                  }`}
                >
                  {t('bookingStatus.emailOrPhone')}
                </label>
                </div>

              {/* Submit Button */}
                <Button 
                  type="submit" 
                className="w-full py-4 text-lg font-semibold rounded-xl bg-blue-600 hover:bg-blue-700" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      {t('bookingStatus.searching')}
                    </>
                  ) : (
                    t('bookingStatus.viewMyBookings')
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">{t('bookingStatus.searchingBookings')}</p>
          </div>
        )}

        {/* Bookings List */}
        {hasSearched && !loading && (
          <>
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <button
                  onClick={handleBackNavigation}
                  className="flex items-center text-gray-500 hover:text-gray-700 text-sm transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  {t('bookingStatus.back')}
                </button>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                {t('bookingStatus.title')}
                <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full font-normal">
                  {bookings.length}
                </span>
              </h1>
            </div>

            {/* User Context Bar - Enhanced */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 flex-shrink-0">
                    {searchType === 'phone' ? (
                      <Phone className="h-5 w-5 text-gray-600" />
                    ) : (
                      <Mail className="h-5 w-5 text-gray-600" />
                    )}
                    </div>
                    <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 font-medium mb-1">{t('bookingStatus.viewingBookingsFor')}</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{customerIdentifier}</p>
                    </div>
                  </div>
                <button
                    onClick={() => {
                      setHasSearched(false);
                      setBookings([]);
                      setCustomerIdentifier('');
                      setSearchType(null);
                    }}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0 border border-blue-200 bg-white"
                  >
                  {t('bookingStatus.changeIdentifier')}
                </button>
              </div>
                </div>

            {bookings.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('bookingStatus.noBookingsFound')}</h3>
                  <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                    {t('bookingStatus.noBookingsMessage')}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      onClick={() => {
                        setHasSearched(false);
                        setBookings([]);
                        setCustomerIdentifier('');
                        setSearchType(null);
                      }}
                      className="px-8 py-3 text-lg"
                    >
                      {t('bookingStatus.tryDifferentIdentifier')}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleBackNavigation}
                      className="px-8 py-3 text-lg border-gray-300"
                    >
                      {t('bookingStatus.backToVendor')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking, index) => {
                  // Check if customer name differs from identifier (simplified check)
                  const identifierPart = searchType === 'email' 
                    ? customerIdentifier.toLowerCase().split('@')[0]
                    : customerIdentifier;
                  const showCustomerName = booking.customerName && 
                    booking.customerName.toLowerCase() !== identifierPart.toLowerCase();
                  
                  return (
                    <Card 
                      key={booking.id} 
                      className="hover:shadow-lg transition-all duration-300 border border-gray-200 shadow-sm overflow-hidden cursor-pointer"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowBookingModal(true);
                      }}
                    >
                      {/* Status Indicator Bar */}
                      <div className={`h-1 ${getStatusColor(booking.status).split(' ')[0]} bg-opacity-30`}></div>
                    
                      <CardContent className="p-5">
                        {/* Row 1: Service Title (Left) + Price + Status (Right) */}
                        <div className="flex items-start justify-between mb-3">
                          <CardTitle className="text-lg font-bold text-gray-900 truncate flex-1 pr-4">
                            {booking.serviceName}
                          </CardTitle>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xl font-bold text-blue-600 mb-1">
                            {formatPrice(booking)}
                          </div>
                            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {getStatusIcon(booking.status)}
                              <span className="ml-1">{t(`status.${booking.status}`, booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || 'Pending')}</span>
                        </div>
                          </div>
                        </div>
                        
                        {/* Vendor Name - Full Width */}
                        {booking.vendorName && (
                          <div className="mb-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <p className="text-xs text-gray-500">
                                {t('bookingStatus.vendor')}: <span className="text-gray-700 font-medium">{booking.vendorName}</span>
                                {booking.vendorBusinessType && (
                                  <span className="text-gray-500 ml-1">({booking.vendorBusinessType})</span>
                                )}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Row 2: Details Grid (2 columns) + Customer Name (full width) */}
                        <div className="grid grid-cols-2 gap-4 my-3">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm font-medium">{formatDate(booking.bookingDate)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm font-medium">{formatTime(booking.bookingTime)}</span>
                          </div>
                        </div>
                        
                        {/* Customer Name - Full Width */}
                        {showCustomerName && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-500">
                              {t('bookingStatus.customer')}: <span className="text-gray-700">{booking.customerName}</span>
                            </p>
                          </div>
                        )}

                      {/* Special Notes */}
                      {booking.notes && (
                          <div className="mb-3">
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r">
                              <div className="flex gap-2">
                                <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="text-xs font-medium text-yellow-800 mb-1">{t('bookingStatus.specialNotes')}</h4>
                                  <p className="text-sm text-yellow-700">{booking.notes}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                        {/* Row 3: Action Footer (Gray Background) */}
                        <div className="bg-gray-50 -mx-5 -mb-5 px-5 py-3 mt-4 flex gap-2">
                          {booking.status === 'completed' ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReorderBooking(booking);
                              }}
                              className="border-blue-300 text-blue-700 hover:bg-blue-50 bg-white text-xs"
                            >
                              <RotateCw className="h-3 w-3 mr-1.5" />
                              {t('bookingStatus.reorder')}
                            </Button>
                          ) : booking.status === 'confirmed' || booking.status === 'pending' ? (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRescheduleBooking(booking);
                                }}
                                className="border-gray-300 text-gray-700 hover:bg-white bg-white text-xs flex-1"
                              >
                                <Calendar className="h-3 w-3 mr-1.5" />
                                {t('bookingStatus.reschedule')}
                              </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelBooking(booking);
                                }}
                                className="border-red-300 text-red-600 hover:bg-red-50 bg-white text-xs flex-1"
                          >
                                <XCircle className="h-3 w-3 mr-1.5" />
                                {t('bookingStatus.cancel')}
                          </Button>
                            </>
                          ) : booking.status === 'cancelled' ? (
                            // No action buttons for cancelled bookings
                            null
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                const pathLang = location.pathname.split('/').filter(Boolean)[0] || 'en';
                                navigate(`/${pathLang}/vendor/${booking.vendorId}`);
                              }}
                              className="border-blue-300 text-blue-700 hover:bg-blue-50 bg-white text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1.5" />
                              {t('bookingStatus.view')}
                            </Button>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Booking Details Modal */}
        {showBookingModal && selectedBooking && (
          <>
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
              onClick={() => setShowBookingModal(false)}
            ></div>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div 
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">{t('bookingStatus.bookingDetails')}</h2>
                      <p className="text-blue-100 text-sm">{selectedBooking.serviceName}</p>
                    </div>
                    <button
                      onClick={() => setShowBookingModal(false)}
                      className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto flex-1 px-6 py-6">
                  {/* Service Info Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 mb-6 border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedBooking.serviceName}</h3>
                        <p className="text-2xl font-bold text-blue-600 mt-2">{formatPrice(selectedBooking)}</p>
                      </div>
                      <div className={`px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${getStatusColor(selectedBooking.status)}`}>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(selectedBooking.status)}
                          <span>{t(`status.${selectedBooking.status}`, selectedBooking.status?.charAt(0).toUpperCase() + selectedBooking.status?.slice(1) || 'Pending')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">{t('bookingStatus.statusTimeline')}</h4>
                    <div className="relative pl-8 space-y-6">
                      {/* Connecting Line */}
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                      
                      {/* Booking Submitted */}
                      <div className="relative flex items-start gap-4">
                        <div className="absolute -left-8 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ring-4 ring-blue-100 z-10">
                          <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                          <p className="font-semibold text-gray-900 mb-1">{t('bookingStatus.bookingSubmitted')}</p>
                          <p className="text-sm text-gray-600 mb-2">{t('bookingStatus.waitingForApproval')}</p>
                          {selectedBooking.createdAt && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                              <Clock className="h-3 w-3" />
                              <span>{formatTimestamp(selectedBooking.createdAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Booking Confirmed */}
                      {selectedBooking.status === 'confirmed' || selectedBooking.status === 'completed' ? (
                        <div className="relative flex items-start gap-4">
                          <div className="absolute -left-8 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ring-4 ring-green-100 z-10">
                            <CheckCircle className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 bg-white rounded-lg p-4 border border-green-200 shadow-sm bg-gradient-to-br from-green-50 to-white">
                            <p className="font-semibold text-gray-900 mb-1">{t('bookingStatus.bookingConfirmed')}</p>
                            <p className="text-sm text-gray-600 mb-2">{t('bookingStatus.confirmedByVendor')}</p>
                            {selectedBooking.updatedAt && (
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                                <Clock className="h-3 w-3" />
                                <span>{formatTimestamp(selectedBooking.updatedAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : selectedBooking.status === 'pending' ? (
                        <div className="relative flex items-start gap-4">
                          <div className="absolute -left-8 w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ring-4 ring-gray-100 z-10">
                            <AlertCircle className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200 shadow-sm opacity-60">
                            <p className="font-semibold text-gray-500 mb-1">{t('bookingStatus.bookingConfirmed')}</p>
                            <p className="text-sm text-gray-500">{t('bookingStatus.pendingConfirmation')}</p>
                          </div>
                        </div>
                      ) : null}

                      {/* Booking Cancelled */}
                      {selectedBooking.status === 'cancelled' && (
                        <div className="relative flex items-start gap-4">
                          <div className="absolute -left-8 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ring-4 ring-red-100 z-10">
                            <XCircle className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 bg-white rounded-lg p-4 border border-red-200 shadow-sm bg-gradient-to-br from-red-50 to-white">
                            <p className="font-semibold text-gray-900 mb-1">{t('bookingStatus.bookingCancelled')}</p>
                            <p className="text-sm text-gray-600 mb-2">{t('bookingStatus.cancelledBy')}</p>
                            {selectedBooking.updatedAt && (
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                                <Clock className="h-3 w-3" />
                                <span>{formatTimestamp(selectedBooking.updatedAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">{t('bookingStatus.bookingInformation')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">{t('bookingStatus.date')}</p>
                            <p className="font-semibold text-gray-900">{formatDate(selectedBooking.bookingDate)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Clock className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">{t('bookingStatus.time')}</p>
                            <p className="font-semibold text-gray-900">{formatTime(selectedBooking.bookingTime)}</p>
                          </div>
                        </div>
                      </div>
                      {selectedBooking.vendorName && (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">{t('bookingStatus.vendor')}</p>
                              <p className="font-semibold text-gray-900">{selectedBooking.vendorName}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <User className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">{t('bookingStatus.customer')}</p>
                            <p className="font-semibold text-gray-900">{selectedBooking.customerName}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Special Notes */}
                  {selectedBooking.notes && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('bookingStatus.specialNotes')}</h4>
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-700 leading-relaxed">{selectedBooking.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer with Action Buttons */}
                <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {(selectedBooking.status === 'confirmed' || selectedBooking.status === 'completed') && (
                      <Button
                        onClick={() => handleAddToCalendar(selectedBooking)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                      >
                        <CalendarPlus className="h-4 w-4 mr-2" />
                        {t('bookingStatus.addToCalendar')}
                      </Button>
                    )}
                    <Button
                      onClick={() => setShowBookingModal(false)}
                      variant="outline"
                      className="flex-1 border-gray-300 hover:bg-gray-100"
                    >
                      {t('bookingStatus.close')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BookingStatus;
