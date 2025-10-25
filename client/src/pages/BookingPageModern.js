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

const BookingPageModern = () => {
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

  useEffect(() => {
    if (location.state?.vendor && location.state?.services) {
      setVendor(location.state.vendor);
      setServices(location.state.services);
    } else {
      fetchVendorData();
    }
  }, [location.state, fetchVendorData]);

  const handleServiceToggle = (service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id);
      if (exists) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, { ...service, quantity: 1 }];
      }
    });
  };

  const handleQuantityChange = (serviceId, delta) => {
    setSelectedServices(prev => 
      prev.map(s => 
        s.id === serviceId 
          ? { ...s, quantity: Math.max(1, s.quantity + delta) } 
          : s
      )
    );
  };

  const calculateTotalPrice = () => {
    return selectedServices.reduce((total, service) => {
      return total + (service.price * service.quantity);
    }, 0);
  };

  const calculateTotalDuration = () => {
    return selectedServices.reduce((total, service) => {
      return total + (service.duration * service.quantity);
    }, 0);
  };

  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleBookingSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select date and time');
      return;
    }
    if (!customerInfo.name || !customerInfo.phone) {
      toast.error('Please enter your name and phone number');
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        vendorEmail: vendor.email,
        services: selectedServices.map(s => ({
          service: s.id,
          quantity: s.quantity,
          price: s.price,
          duration: s.duration
        })),
        bookingDate: selectedDate,
        startTime: selectedTime,
        customer: customerInfo,
        totalPrice: calculateTotalPrice(),
        totalDuration: calculateTotalDuration()
      };
      const response = await axios.post('/bookings', bookingData);
      setBooking(response.data.booking);
      setStep(3); // Move to confirmation step
      toast.success(t('bookingSuccess'));
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(t('failedToCreateBooking'));
    } finally {
      setLoading(false);
    }
  };

  if (loading && !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Vendor Not Found</h1>
          <p className="text-gray-600 mb-6">The vendor you're looking for doesn't exist or is inactive.</p>
          <Button onClick={() => navigate('/')} className="w-full">
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  const renderStep1 = () => (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('selectServices')}</h2>
      <div className="space-y-4 mb-6">
        {services.length > 0 ? (
          services.map((service) => (
            <div
              key={service.id}
              className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                selectedServices.some(s => s.id === service.id)
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:shadow-sm'
              }`}
              onClick={() => handleServiceToggle(service)}
            >
              <div>
                <h4 className="font-semibold text-gray-900">
                  {service.name[language] || service.name.en}
                </h4>
                <p className="text-sm text-gray-600">
                  {service.description[language] || service.description.en}
                </p>
                <p className="text-sm text-gray-500">
                  {t('duration')}: {service.duration} {t('minutes')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600">
                  RM {service.price.toFixed(2)}
                </p>
                {selectedServices.some(s => s.id === service.id) && (
                  <div className="flex items-center mt-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuantityChange(service.id, -1);
                      }}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="mx-2 text-gray-900">
                      {selectedServices.find(s => s.id === service.id)?.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuantityChange(service.id, 1);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center">{t('noServicesAvailable')}</p>
        )}
      </div>
      <div className="flex justify-end">
        <Button onClick={() => setStep(2)} disabled={selectedServices.length === 0}>
          {t('next')} <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('selectDateTime')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('selectDate')}</label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('selectTime')}</label>
          <Input
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setStep(1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('back')}
        </Button>
        <Button onClick={() => setStep(3)} disabled={!selectedDate || !selectedTime}>
          {t('next')} <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </Card>
  );

  const renderStep3 = () => (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('customerInformation')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('fullName')} *</label>
          <Input
            type="text"
            name="name"
            value={customerInfo.name}
            onChange={handleCustomerInfoChange}
            placeholder={t('enterFullName')}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('phoneNumber')} *</label>
          <Input
            type="tel"
            name="phone"
            value={customerInfo.phone}
            onChange={handleCustomerInfoChange}
            placeholder={t('enterPhoneNumber')}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('emailAddress')}</label>
          <Input
            type="email"
            name="email"
            value={customerInfo.email}
            onChange={handleCustomerInfoChange}
            placeholder={t('enterEmailAddress')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('notes')}</label>
          <Input
            type="text"
            name="notes"
            value={customerInfo.notes}
            onChange={handleCustomerInfoChange}
            placeholder={t('enterNotes')}
          />
        </div>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(2)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('back')}
        </Button>
        <Button onClick={handleBookingSubmit} disabled={loading}>
          {loading ? t('processing') : t('confirmBooking')}
        </Button>
      </div>
    </Card>
  );

  const renderConfirmation = () => (
    <Card className="p-6 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('bookingConfirmed')}</h2>
      <p className="text-gray-600 mb-6">
        {t('bookingConfirmationMessage')}
      </p>
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">{t('bookingDetails')}</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>{t('vendor')}:</strong> {vendor.businessName}</p>
          <p><strong>{t('date')}:</strong> {selectedDate}</p>
          <p><strong>{t('time')}:</strong> {selectedTime}</p>
          <p><strong>{t('totalPrice')}:</strong> RM {calculateTotalPrice().toFixed(2)}</p>
        </div>
      </div>
      <Button onClick={() => navigate('/')} className="w-full">
        {t('backToHome')}
      </Button>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>{t('back')}</span>
            </Button>
            <div className="text-sm text-gray-600">
              {t('step')} {step} {t('of')} 3
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center">
              {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {stepNumber}
                  </div>
                  {stepNumber < 3 && (
                    <div className={`w-16 h-1 mx-2 ${
                      step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && !booking && renderStep3()}
          {step === 3 && booking && renderConfirmation()}

          {/* Booking Summary */}
          {selectedServices.length > 0 && (
            <Card className="mt-6 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">{t('bookingSummary')}</h3>
              <div className="space-y-2">
                {selectedServices.map(service => (
                  <div key={service.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {service.name[language] || service.name.en} (x{service.quantity})
                    </span>
                    <span className="font-medium">
                      RM {(service.price * service.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>{t('total')}:</span>
                  <span>RM {calculateTotalPrice().toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {t('estimatedDuration')}: {calculateTotalDuration()} {t('minutes')}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPageModern;
