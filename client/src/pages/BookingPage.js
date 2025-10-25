import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Calendar, Clock, User, Phone, Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import axios from '../config/axios';
import { toast } from 'react-toastify';

const BookingPage = () => {
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

  // Get vendor and services from location state or fetch from API
  useEffect(() => {
    if (location.state?.vendor && location.state?.services) {
      setVendor(location.state.vendor);
      setServices(location.state.services);
    } else {
      fetchVendorData();
    }
  }, [location.state, vendorId]);

  const fetchVendorData = async () => {
    try {
      const response = await axios.get(`/api/vendors/public/${vendorId}`);
      setVendor(response.data.vendor);
      setServices(response.data.services);
    } catch (error) {
      console.error('Error fetching vendor data:', error);
      toast.error('Failed to load vendor information');
    }
  };

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
    // This would typically fetch from the API based on selected date
    // For now, return mock time slots
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
        vendorEmail: vendor.email,
        services: selectedServices,
        customer: customerInfo,
        bookingDate: selectedDate,
        startTime: selectedTime,
        notes: customerInfo.notes
      };

      const response = await axios.post('/bookings', bookingData);
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
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading">
          <div className="spinner"></div>
          <span className="ml-3">{t('loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            {t('back')}
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">
            Book with {vendor.businessName}
          </h1>
          <p className="text-gray-600 mt-2">
            Complete your booking in a few simple steps
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
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
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Select Services</span>
            <span>Date & Time</span>
            <span>Your Info</span>
            <span>Confirmation</span>
          </div>
        </div>

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
                  <div key={service.id} className="card">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {service.name[language] || service.name.en}
                      </h3>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          {formatPrice(service.price)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDuration(service.duration)}
                        </div>
                      </div>
                    </div>

                    {service.description && (
                      <p className="text-gray-600 mb-4 text-sm">
                        {service.description[language] || service.description.en}
                      </p>
                    )}

                    {isSelected && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity:
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(service.id, selectedQuantity - 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{selectedQuantity}</span>
                          <button
                            onClick={() => handleQuantityChange(service.id, selectedQuantity + 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleServiceToggle(service)}
                      className={`w-full ${
                        isSelected 
                          ? 'btn btn-secondary' 
                          : 'btn btn-outline'
                      }`}
                    >
                      {isSelected ? 'Remove' : 'Add to Booking'}
                    </button>
                  </div>
                );
              })}
            </div>

            {selectedServices.length > 0 && (
              <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Booking Summary
                </h3>
                <div className="space-y-2">
                  {selectedServices.map((selectedService) => {
                    const service = services.find(s => s.id === selectedService.service);
                    return (
                      <div key={selectedService.service} className="flex justify-between">
                        <span>
                          {service.name[language] || service.name.en} x{selectedService.quantity}
                        </span>
                        <span className="font-semibold">
                          {formatPrice(service.price * selectedService.quantity)}
                        </span>
                      </div>
                    );
                  })}
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatPrice(calculateTotal())}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Duration: {formatDuration(calculateDuration())}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={selectedServices.length === 0}
                className="btn btn-primary"
              >
                {t('next')}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t('selectDateTime')}
            </h2>
            
            <div className="card">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date:
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="form-input"
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
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`p-3 text-sm rounded-lg border transition-colors ${
                          selectedTime === time
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="btn btn-outline"
              >
                {t('previous')}
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedDate || !selectedTime}
                className="btn btn-primary"
              >
                {t('next')}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Customer Information */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t('customerInfo')}
            </h2>
            
            <div className="card">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('name')} *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('phone')} *
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('email')}
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('notes')}
                  </label>
                  <textarea
                    value={customerInfo.notes}
                    onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
                    className="form-input form-textarea"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="btn btn-outline"
              >
                {t('previous')}
              </button>
              <button
                onClick={handleBookingSubmit}
                disabled={loading || !customerInfo.name || !customerInfo.phone}
                className="btn btn-primary"
              >
                {loading ? t('loading') : t('bookNow')}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && booking && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="card">
              <CheckCircle size={64} className="mx-auto text-green-600 mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t('bookingSuccess')}
              </h2>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Booking Details
                </h3>
                <div className="space-y-2 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Confirmation Code:</span>
                    <span className="font-semibold">{booking.confirmationCode}</span>
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
                    <span className="font-semibold">{formatPrice(booking.totalPrice)}</span>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                You will receive a confirmation message shortly. 
                Please arrive on time for your appointment.
              </p>

              <button
                onClick={() => navigate('/')}
                className="btn btn-primary"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;
