import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { toast } from 'react-toastify';
import { Calendar, Clock, User, Phone, Mail, MapPin, ArrowLeft, CheckCircle, XCircle, AlertCircle, Eye, RotateCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const BookingStatus = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    // Get customer email from localStorage or prompt
    const savedEmail = localStorage.getItem('customerEmail');
    if (savedEmail) {
      setCustomerEmail(savedEmail);
      // Don't set hasSearched to true immediately - wait for actual search
      fetchBookings(savedEmail);
    }
  }, []);

  const fetchBookings = async (email) => {
    try {
      console.log('Fetching bookings for email:', email);
      setLoading(true);
      
      // Remove orderBy to avoid composite index requirement
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('customerEmail', '==', email)
      );
      
      const querySnapshot = await getDocs(bookingsQuery);
      const bookingsData = [];
      
      querySnapshot.forEach((doc) => {
        bookingsData.push({ id: doc.id, ...doc.data() });
      });
      
      // Smart sorting: Split into Upcoming and Past, then sort each group
      const now = new Date();
      const upcoming = [];
      const past = [];
      
      bookingsData.forEach((booking) => {
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
        
        // Compare with current date/time
        if (bookingDateTime >= now) {
          upcoming.push({ ...booking, _sortDateTime: bookingDateTime });
        } else {
          past.push({ ...booking, _sortDateTime: bookingDateTime });
        }
      });
      
      // Sort Upcoming: Date Ascending (nearest first)
      upcoming.sort((a, b) => a._sortDateTime - b._sortDateTime);
      
      // Sort Past: Date Descending (most recent first)
      past.sort((a, b) => b._sortDateTime - a._sortDateTime);
      
      // Merge: Upcoming first, then Past
      const sortedBookings = [...upcoming, ...past];
      
      // Remove the temporary _sortDateTime property
      sortedBookings.forEach(booking => delete booking._sortDateTime);
      
      console.log('Found bookings:', sortedBookings.length, `(${upcoming.length} upcoming, ${past.length} past)`);
      setBookings(sortedBookings);
      setHasSearched(true); // Set hasSearched to true after search completes
      
      if (bookingsData.length === 0) {
        console.log('No bookings found for email:', email);
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

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (customerEmail) {
      localStorage.setItem('customerEmail', customerEmail);
      setHasSearched(true);
      fetchBookings(customerEmail);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
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
    const confirmed = window.confirm("Are you sure you want to cancel this booking? This action cannot be undone.");
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
      
      toast.success('Booking cancelled successfully');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking. Please try again.');
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

  // Debug logging
  console.log('BookingStatus render - hasSearched:', hasSearched, 'loading:', loading, 'bookings.length:', bookings.length);

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
                Back
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
              <p className="text-base text-gray-600">Enter your email to view your service bookings</p>
            </div>

            {/* Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              {/* Floating Label Input */}
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="peer w-full px-4 pt-6 pb-2 text-lg border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                  placeholder=" "
                  required
                />
                <label
                  htmlFor="email"
                  className={`absolute left-4 transition-all duration-200 ${
                    customerEmail 
                      ? 'top-2 text-sm text-blue-600 font-medium' 
                      : 'top-4 text-base text-gray-500 peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-600 peer-focus:font-medium'
                  }`}
                >
                  Email Address
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
                    Searching...
                  </>
                ) : (
                  'View My Bookings'
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
            <p className="text-gray-600">Searching for your bookings...</p>
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
                  Back
                </button>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                My Bookings
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
                    <Mail className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 font-medium mb-1">Viewing bookings for</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{customerEmail}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setHasSearched(false);
                    setBookings([]);
                  }}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0 border border-blue-200 bg-white"
                >
                  Change Email
                </button>
              </div>
            </div>

            {bookings.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No Bookings Found</h3>
                  <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                    No bookings found for this email address. Please check your email or try a different one.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      onClick={() => {
                        setHasSearched(false);
                        setBookings([]);
                      }}
                      className="px-8 py-3 text-lg"
                    >
                      Try Different Email
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleBackNavigation}
                      className="px-8 py-3 text-lg border-gray-300"
                    >
                      Back to Vendor
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking, index) => {
                  // Check if customer name differs from email (simplified check)
                  const showCustomerName = booking.customerName && 
                    booking.customerName.toLowerCase() !== customerEmail.toLowerCase().split('@')[0];
                  
                  return (
                    <Card key={booking.id} className="hover:shadow-lg transition-all duration-300 border border-gray-200 shadow-sm overflow-hidden">
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
                              <span className="ml-1 capitalize">{booking.status}</span>
                            </div>
                          </div>
                        </div>

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
                              Customer: <span className="text-gray-700">{booking.customerName}</span>
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
                                  <h4 className="text-xs font-medium text-yellow-800 mb-1">Special Notes</h4>
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
                              onClick={() => handleReorderBooking(booking)}
                              className="border-blue-300 text-blue-700 hover:bg-blue-50 bg-white text-xs"
                            >
                              <RotateCw className="h-3 w-3 mr-1.5" />
                              Reorder
                            </Button>
                          ) : booking.status === 'confirmed' || booking.status === 'pending' ? (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleRescheduleBooking(booking)}
                                className="border-gray-300 text-gray-700 hover:bg-white bg-white text-xs flex-1"
                              >
                                <Calendar className="h-3 w-3 mr-1.5" />
                                Reschedule
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleCancelBooking(booking)}
                                className="border-red-300 text-red-600 hover:bg-red-50 bg-white text-xs flex-1"
                              >
                                <XCircle className="h-3 w-3 mr-1.5" />
                                Cancel
                              </Button>
                            </>
                          ) : booking.status === 'cancelled' ? (
                            // No action buttons for cancelled bookings
                            null
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const pathLang = location.pathname.split('/').filter(Boolean)[0] || 'en';
                                navigate(`/${pathLang}/vendor/${booking.vendorId}`);
                              }}
                              className="border-blue-300 text-blue-700 hover:bg-blue-50 bg-white text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1.5" />
                              View
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
      </div>
    </div>
  );
};

export default BookingStatus;
