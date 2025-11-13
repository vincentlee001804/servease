import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { CheckCircle, Calendar, Clock, User, Phone, Mail, MapPin, ArrowLeft, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const BookingSuccess = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600">
            Your booking request has been submitted successfully. The vendor will contact you soon.
          </p>
        </div>

        {/* Booking Details */}
        {booking && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">{booking.serviceName}</h3>
                  <p className="text-sm text-gray-600">Service</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{formatPriceFromBooking(booking)}</h3>
                  <p className="text-sm text-gray-600">Estimated Price</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              {booking.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Special Notes</h4>
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
                Your Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-3 text-gray-500" />
                <div>
                  <p className="font-medium">{booking.customerName}</p>
                  <p className="text-sm text-gray-600">Full Name</p>
                </div>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-3 text-gray-500" />
                <div>
                  <p className="font-medium">{booking.customerEmail}</p>
                  <p className="text-sm text-gray-600">Email Address</p>
                </div>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-3 text-gray-500" />
                <div>
                  <p className="font-medium">{booking.customerPhone}</p>
                  <p className="text-sm text-gray-600">Phone Number</p>
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
                Vendor Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-medium text-gray-900">{vendor.businessName}</h3>
                <p className="text-sm text-gray-600">Business Name</p>
              </div>
              {vendor.businessInfo?.address && (
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-3 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium">{vendor.businessInfo.address}</p>
                    <p className="text-sm text-gray-600">Address</p>
                  </div>
                </div>
              )}
              {vendor.contactInfo?.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-3 text-gray-500" />
                  <div>
                    <p className="font-medium">{vendor.contactInfo.phone}</p>
                    <p className="text-sm text-gray-600">Phone</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Status Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">1</span>
                </div>
                <div>
                  <p className="font-medium">Booking Submitted</p>
                  <p className="text-sm text-gray-600">Your booking request has been sent to the vendor.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-medium text-gray-600">2</span>
                </div>
                <div>
                  <p className="font-medium">Vendor Confirmation</p>
                  <p className="text-sm text-gray-600">The vendor will review and confirm your booking.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-medium text-gray-600">3</span>
                </div>
                <div>
                  <p className="font-medium">Service Delivery</p>
                  <p className="text-sm text-gray-600">Attend your appointment at the scheduled time.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => navigate(`/vendor/${vendorId}`)}
            variant="outline"
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Services
          </Button>
          <Button 
            onClick={() => navigate('/bookings')}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            View All Bookings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
