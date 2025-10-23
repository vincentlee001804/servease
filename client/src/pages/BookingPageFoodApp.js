import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { 
  Clock, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  Plus,
  Minus
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import axios from '../config/axios';
import { toast } from 'react-toastify';

const BookingPageFoodApp = () => {
  const { vendorId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  
  const [step, setStep] = useState(1);
  const [vendor, setVendor] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    if (location.state?.vendor && location.state?.services) {
      setVendor(location.state.vendor);
      setServices(location.state.services);
    } else {
      fetchVendorData();
    }
  }, [location.state, vendorId, fetchVendorData]);

  const fetchVendorData = useCallback(async () => {
    try {
      const response = await axios.get(`/api/vendors/public/${vendorId}`);
      setVendor(response.data.vendor);
      setServices(response.data.services);
    } catch (error) {
      console.error('Error fetching vendor data:', error);
      toast.error('Failed to load vendor information');
    }
  }, [vendorId]);

  const handleServiceToggle = (service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.service === service.id);
      if (exists) {
        return prev.filter(s => s.service !== service.id);
      } else {
        return [...prev, { service: service.id, quantity: 1 }];
      }
    });
  };

  const handleQuantityChange = (serviceId, quantity) => {
    setSelectedServices(prev => 
      prev.map(s => 
        s.service === serviceId 
          ? { ...s, quantity: Math.max(1, quantity) }
          : s
      )
    );
  };

  const calculateTotal = () => {
    return selectedServices.reduce((total, selectedService) => {
      const service = services.find(s => s.id === selectedService.service);
      return total + (service.price * selectedService.quantity);
    }, 0);
  };

  const calculateDuration = () => {
    return selectedServices.reduce((total, selectedService) => {
      const service = services.find(s => s.id === selectedService.service);
      return total + (service.duration * selectedService.quantity);
    }, 0);
  };

  const getAvailableTimeSlots = () => {
    const slots = [];
    const startHour = 9;
    const endHour = 18;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    
    return slots;
  };

  const handleBookingSubmit = async () => {
    if (!selectedServices.length || !selectedDate || !selectedTime || !customerInfo.name || !customerInfo.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        vendorId: vendor._id,
        services: selectedServices,
        customer: customerInfo,
        bookingDate: selectedDate,
        startTime: selectedTime,
        notes: customerInfo.notes
      };

      const response = await axios.post('/api/bookings', bookingData);
      setBooking(response.data.booking);
      setStep(4);
      toast.success('Booking created successfully!');
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => `RM ${price}`;
  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-900">Book with {vendor.businessName}</h1>
              <p className="text-sm text-gray-500">Step {step} of 4</p>
            </div>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= stepNumber 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Step 1: Select Services */}
        {step === 1 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t('selectServices')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((service) => {
                const isSelected = selectedServices.find(s => s.service === service.id);
                const selectedQuantity = isSelected?.quantity || 1;
                
                return (
                  <Card key={service.id} className={`group hover:shadow-lg transition-all duration-300 ${
                    isSelected ? 'ring-2 ring-blue-600' : ''
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {service.name[language] || service.name.en}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>{formatDuration(service.duration)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-blue-600">
                            {formatPrice(service.price)}
                          </div>
                        </div>
                      </div>

                      {service.description && (
                        <p className="text-gray-600 mb-4 text-sm">
                          {service.description[language] || service.description.en}
                        </p>
                      )}

                      {isSelected && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900">Quantity:</span>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(service.id, selectedQuantity - 1)}
                                className="w-8 h-8 p-0"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">{selectedQuantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(service.id, selectedQuantity + 1)}
                                className="w-8 h-8 p-0"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={() => handleServiceToggle(service)}
                        className={`w-full ${
                          isSelected 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {isSelected ? 'Remove from Booking' : 'Add to Booking'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {selectedServices.length > 0 && (
              <Card className="mt-8 bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Booking Summary
                  </h3>
                  <div className="space-y-3">
                    {selectedServices.map((selectedService) => {
                      const service = services.find(s => s.id === selectedService.service);
                      return (
                        <div key={selectedService.service} className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">
                              {service.name[language] || service.name.en} x{selectedService.quantity}
                            </span>
                            <div className="text-sm text-gray-500">
                              {formatDuration(service.duration * selectedService.quantity)}
                            </div>
                          </div>
                          <span className="font-semibold text-blue-600">
                            {formatPrice(service.price * selectedService.quantity)}
                          </span>
                        </div>
                      );
                    })}
                    <div className="border-t pt-3 flex justify-between items-center font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-blue-600">{formatPrice(calculateTotal())}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Total Duration: {formatDuration(calculateDuration())}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="mt-8 flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={selectedServices.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {t('next')}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t('selectDateTime')}
            </h2>
            
            <Card>
              <CardContent className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date:
                  </label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Time:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {getAvailableTimeSlots().map((time) => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          onClick={() => setSelectedTime(time)}
                          className="text-sm"
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-8 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                {t('previous')}
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!selectedDate || !selectedTime}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {t('next')}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Customer Information */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t('customerInfo')}
            </h2>
            
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('name')} *
                    </label>
                    <Input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('phone')} *
                    </label>
                    <Input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('email')}
                    </label>
                    <Input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      placeholder="Enter your email (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('notes')}
                    </label>
                    <textarea
                      value={customerInfo.notes}
                      onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Any special requests or notes (optional)"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                {t('previous')}
              </Button>
              <Button
                onClick={handleBookingSubmit}
                disabled={loading || !customerInfo.name || !customerInfo.phone}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? t('loading') : t('bookNow')}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && booking && (
          <div className="max-w-2xl mx-auto text-center">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {t('bookingSuccess')}
                </h2>
                
                <div className="bg-white rounded-lg p-6 mb-6 text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Booking Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Confirmation Code:</span>
                      <span className="font-semibold text-blue-600">{booking.confirmationCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span>{new Date(booking.bookingDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span>{booking.startTime} - {booking.endTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-semibold text-green-600">{formatPrice(booking.totalPrice)}</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 mb-6">
                  You will receive a confirmation message shortly. 
                  Please arrive on time for your appointment.
                </p>

                <Button
                  onClick={() => navigate('/')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Back to Home
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPageFoodApp;
