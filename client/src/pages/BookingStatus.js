import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { Calendar, Clock, User, Phone, Mail, MapPin, ArrowLeft, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
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
      
      // Sort on client side to avoid composite index requirement
      bookingsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB - dateA; // Sort by newest first
      });
      
      console.log('Found bookings:', bookingsData.length);
      setBookings(bookingsData);
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
    // Check if we came from a vendor page
    const referrer = document.referrer;
    if (referrer && referrer.includes('/vendor/')) {
      // Extract vendor ID from referrer URL
      const vendorIdMatch = referrer.match(/\/vendor\/([^\/\?]+)/);
      if (vendorIdMatch) {
        navigate(`/vendor/${vendorIdMatch[1]}`);
        return;
      }
    }
    
    // Check if there's a vendor ID in the bookings
    if (bookings.length > 0 && bookings[0].vendorId) {
      navigate(`/vendor/${bookings[0].vendorId}`);
      return;
    }
    
    // Fallback to browser back
    navigate(-1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <Button 
              variant="outline" 
              onClick={handleBackNavigation}
              className="flex items-center w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vendor
            </Button>
            <div className="text-center sm:text-right">
              <p className="text-sm text-gray-500">Total Bookings</p>
              <p className="text-2xl font-bold text-blue-600">{bookings.length}</p>
            </div>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">My Bookings</h1>
            <p className="text-base sm:text-lg text-gray-600">View and manage your service bookings</p>
          </div>
        </div>

        {/* Email Input Form */}
        {!hasSearched && (
          <Card className="mb-8 shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-xl text-center">Find Your Bookings</CardTitle>
              <p className="text-gray-600 text-center">Enter your email address to view your service bookings</p>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg transition-colors"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full py-4 text-lg font-semibold rounded-xl" 
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
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="mb-6">
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Searching for your bookings...</p>
            </CardContent>
          </Card>
        )}

        {/* Bookings List */}
        {hasSearched && !loading && (
          <>
            {/* Search Results Header */}
            <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardContent className="py-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-600">Searching for bookings with:</p>
                      <p className="font-semibold text-gray-900 text-lg truncate">{customerEmail}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setHasSearched(false);
                      setBookings([]);
                    }}
                    className="border-green-300 text-green-700 hover:bg-green-50 w-full sm:w-auto flex-shrink-0"
                  >
                    Search Different Email
                  </Button>
                </div>
              </CardContent>
            </Card>

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
              <div className="space-y-6">
                {bookings.map((booking, index) => (
                  <Card key={booking.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
                    {/* Status Header */}
                    <div className={`h-2 ${getStatusColor(booking.status).split(' ')[0]} bg-opacity-20`}></div>
                    
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-blue-600 font-bold text-sm">#{index + 1}</span>
                            </div>
                            <CardTitle className="text-xl text-gray-900">{booking.serviceName}</CardTitle>
                          </div>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                            {getStatusIcon(booking.status)}
                            <span className="ml-2 capitalize">{booking.status}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600 mb-1">
                            {formatPrice(booking)}
                          </div>
                          <p className="text-sm text-gray-500">Price</p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      {/* Booking Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{formatDate(booking.bookingDate)}</p>
                            <p className="text-sm text-gray-600">Appointment Date</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                            <Clock className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{formatTime(booking.bookingTime)}</p>
                            <p className="text-sm text-gray-600">Appointment Time</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            <User className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{booking.customerName}</p>
                            <p className="text-sm text-gray-600">Customer Name</p>
                          </div>
                        </div>
                      </div>

                      {/* Special Notes */}
                      {booking.notes && (
                        <div className="mb-6">
                          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-yellow-400" />
                              </div>
                              <div className="ml-3">
                                <h4 className="text-sm font-medium text-yellow-800">Special Notes</h4>
                                <p className="text-sm text-yellow-700 mt-1">{booking.notes}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-gray-200 gap-4">
                        <div className="text-sm text-gray-500">
                          <p className="font-medium">Booked on</p>
                          <p>{new Date(booking.createdAt?.toDate?.() || booking.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/vendor/${booking.vendorId}`)}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 w-full sm:w-auto"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Vendor
                          </Button>
                          {booking.status === 'pending' && (
                            <Button 
                              size="sm"
                              className="bg-yellow-600 hover:bg-yellow-700 text-white w-full sm:w-auto"
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Awaiting Confirmation
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BookingStatus;
