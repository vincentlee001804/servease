import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase-config';
import { toast } from 'react-toastify';
import { Calendar, Clock, User, DollarSign, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';

const BookingPage = () => {
  const { vendorId, serviceId } = useParams();
  const navigate = useNavigate();
  
  const [vendor, setVendor] = useState(null);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Booking form data
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    selectedDate: '',
    selectedTime: '',
    notes: ''
  });
  
  // Available time slots
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    fetchVendorAndService();
  }, [vendorId, serviceId]);

  const fetchVendorAndService = async () => {
    try {
      setLoading(true);
      
      // Fetch vendor data
      const vendorRef = doc(db, 'vendors', vendorId);
      const vendorSnap = await getDoc(vendorRef);
      
      if (!vendorSnap.exists()) {
        toast.error('Vendor not found');
        navigate(-1); // Go back to previous page instead of home
        return;
      }
      
      const vendorData = vendorSnap.data();
      setVendor({ id: vendorSnap.id, ...vendorData });
      
      // Fetch service data
      const serviceRef = doc(db, 'services', serviceId);
      const serviceSnap = await getDoc(serviceRef);
      
      if (!serviceSnap.exists()) {
        toast.error('Service not found');
        navigate(`/vendor/${vendorId}`);
        return;
      }
      
      const serviceData = serviceSnap.data();
      setService({ id: serviceSnap.id, ...serviceData });
      
      // Generate available time slots for the next 7 days
      generateAvailableSlots(vendorData.operatingHours);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load booking information');
    } finally {
      setLoading(false);
    }
  };

  const generateAvailableSlots = (operatingHours) => {
    const slots = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      const dayHours = operatingHours[dayName];
      if (dayHours && dayHours.isOpen) {
        const startTime = dayHours.open;
        const endTime = dayHours.close;
        
        // Generate 30-minute slots
        const start = new Date(`${date.toDateString()} ${startTime}`);
        const end = new Date(`${date.toDateString()} ${endTime}`);
        
        let current = new Date(start);
        while (current < end) {
          const timeString = current.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
          
          slots.push({
            date: date.toISOString().split('T')[0],
            time: timeString,
            displayDate: date.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            }),
            displayTime: current.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })
          });
          
          current.setMinutes(current.getMinutes() + 30);
        }
      }
    }
    
    setAvailableSlots(slots);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setFormData(prev => ({
      ...prev,
      selectedDate: slot.date,
      selectedTime: slot.time
    }));
  };

  const calculatePrice = () => {
    if (!service) return 0;
    
    if (service.priceType === 'fixed') {
      return service.price;
    } else if (service.priceType === 'range') {
      return service.priceRange?.min || 0;
    } else if (service.priceType === 'from') {
      return service.price;
    }
    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSlot) {
      toast.error('Please select a date and time');
      return;
    }
    
    if (!formData.customerName || !formData.customerEmail || !formData.customerPhone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      const bookingData = {
        vendorId,
        serviceId,
        serviceName: service.name?.en || service.name || 'Service',
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        bookingDate: formData.selectedDate,
        bookingTime: formData.selectedTime,
        notes: formData.notes,
        status: 'pending',
        price: calculatePrice(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, 'bookings'), bookingData);
      
      toast.success('Booking request submitted successfully!');
      navigate(`/booking-success/${vendorId}?bookingId=${docRef.id}`);
      
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to submit booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!vendor || !service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Not Found</h2>
          <p className="text-gray-600 mb-6">The service you're looking for doesn't exist.</p>
          <Button onClick={() => navigate(`/vendor/${vendorId}`)}>Back to Vendor</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate(`/vendor/${vendorId}`)}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Services
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Book Service</h1>
                <p className="text-gray-600 mt-2 truncate">
                  {vendor.businessName} • {service.name?.en || service.name}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/bookings')}
              className="flex items-center w-full sm:w-auto"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Check Booking Status
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Service Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Service Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{service.name?.en || service.name}</h3>
                  <p className="text-gray-600 mt-1">{service.description?.en || service.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">{service.duration} minutes</span>
                        </div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">Max 1 person</span>
                      </div>
                    </div>

                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                  <span className="text-lg font-semibold text-green-600">
                    {service.priceType === 'fixed' && `RM ${service.price}`}
                    {service.priceType === 'range' && `RM ${service.priceRange?.min || 0} - ${service.priceRange?.max || 0}`}
                    {service.priceType === 'from' && `From RM ${service.price}`}
                        </span>
                      </div>
              </CardContent>
            </Card>

            {/* Vendor Info */}
            <Card>
              <CardHeader>
                <CardTitle>Vendor Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{vendor.businessName}</p>
                  <p className="text-sm text-gray-600">{vendor.businessInfo?.address}</p>
                  <p className="text-sm text-gray-600">{vendor.contactInfo?.phone}</p>
            </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Booking Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Customer Details */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Your Details</h3>
                    <Input
                      name="customerName"
                      placeholder="Full Name *"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      name="customerEmail"
                      type="email"
                      placeholder="Email Address *"
                      value={formData.customerEmail}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      name="customerPhone"
                      placeholder="Phone Number *"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                  required
                />
              </div>

                  {/* Date & Time Selection */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Select Date & Time</h3>
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                      {availableSlots.map((slot, index) => (
                      <button
                          key={index}
                          type="button"
                          onClick={() => handleSlotSelect(slot)}
                          className={`p-3 text-left border rounded-lg transition-colors ${
                            selectedSlot?.date === slot.date && selectedSlot?.time === slot.time
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-sm font-medium">{slot.displayDate}</div>
                          <div className="text-xs text-gray-600">{slot.displayTime}</div>
                      </button>
                    ))}
                  </div>
            </div>

                  {/* Additional Notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Additional Notes (Optional)</label>
                  <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Any special requests or notes..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                    rows={3}
                  />
                </div>

                  {/* Price Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Estimated Price:</span>
                      <span className="text-lg font-semibold text-green-600">
                        RM {calculatePrice()}
                      </span>
              </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Final price may vary based on specific requirements
                    </p>
            </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={submitting || !selectedSlot}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      'Submit Booking Request'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
                  </div>
                </div>
      </div>
    </div>
  );
};

export default BookingPage;