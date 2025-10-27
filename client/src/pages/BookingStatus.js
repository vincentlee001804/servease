import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase-config';
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
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={handleBackNavigation}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vendor
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-2">View and manage your service bookings</p>
        </div>

        {/* Email Input Form */}
        {!hasSearched && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Enter Your Email</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Searching...' : 'View My Bookings'}
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
            {/* Search Again Button */}
            <Card className="mb-6">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Searching for bookings with:</p>
                    <p className="font-medium text-gray-900">{customerEmail}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setHasSearched(false);
                      setBookings([]);
                    }}
                  >
                    Search Different Email
                  </Button>
                </div>
              </CardContent>
            </Card>

            {bookings.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Found</h3>
                  <p className="text-gray-600 mb-6">
                    No bookings found for this email address. Please check your email or try a different one.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button 
                      onClick={() => {
                        setHasSearched(false);
                        setBookings([]);
                      }}
                    >
                      Try Different Email
                    </Button>
                    <Button variant="outline" onClick={handleBackNavigation}>
                      Back to Vendor
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{booking.serviceName}</CardTitle>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                          <div className="flex items-center">
                            {getStatusIcon(booking.status)}
                            <span className="ml-2 capitalize">{booking.status}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          <div>
                            <p className="font-medium">{formatDate(booking.bookingDate)}</p>
                            <p className="text-sm text-gray-600">Date</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-gray-500" />
                          <div>
                            <p className="font-medium">{formatTime(booking.bookingTime)}</p>
                            <p className="text-sm text-gray-600">Time</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-500" />
                          <div>
                            <p className="font-medium">{booking.customerName}</p>
                            <p className="text-sm text-gray-600">Customer</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="h-4 w-4 mr-2 text-gray-500 flex items-center justify-center">
                            <span className="text-xs">RM</span>
                          </div>
                          <div>
                            <p className="font-medium">RM {booking.price}</p>
                            <p className="text-sm text-gray-600">Price</p>
                          </div>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-1">Special Notes</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{booking.notes}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                          Booked on {new Date(booking.createdAt?.toDate?.() || booking.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/vendor/${booking.vendorId}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Vendor
                        </Button>
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
