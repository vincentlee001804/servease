import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { doc, getDoc, collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { toast } from 'react-toastify';
import { Calendar, Clock, User, DollarSign, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';

const BookingPage = () => {
  const { vendorId, serviceId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  
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
        toast.error(t('vendorPage.notFound'));
        navigate(-1); // Go back to previous page instead of home
        return;
      }
      
      const vendorData = vendorSnap.data();
      setVendor({ id: vendorSnap.id, ...vendorData });
      
      // Fetch service data
      const serviceRef = doc(db, 'services', serviceId);
      const serviceSnap = await getDoc(serviceRef);
      
      if (!serviceSnap.exists()) {
        toast.error(t('bookingForm.serviceNotFoundTitle'));
        navigate(`/vendor/${vendorId}`);
        return;
      }
      
      const serviceData = serviceSnap.data();
      setService({ id: serviceSnap.id, ...serviceData });
      
      // Generate available time slots for the next 7 days
      generateAvailableSlots(vendorData.operatingHours);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('bookingForm.loadError'));
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
      toast.error(t('bookingForm.selectSlotError'));
      return;
    }
    
    if (!formData.customerName || !formData.customerPhone) {
      toast.error(t('bookingForm.requiredFieldsError'));
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
        // Store service pricing information for proper display
        servicePriceType: service.priceType,
        servicePrice: service.price,
        servicePriceRange: service.priceRange,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, 'bookings'), bookingData);
      
      toast.success(t('bookingForm.requestSuccess'));
      navigate(`/booking-success/${vendorId}?bookingId=${docRef.id}`);
      
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(t('bookingForm.requestFailed'));
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('bookingForm.serviceNotFoundTitle')}</h2>
          <p className="text-gray-600 mb-6">{t('bookingForm.serviceNotFoundDescription')}</p>
          <Button onClick={() => navigate(`/vendor/${vendorId}`)}>{t('bookingForm.backToVendor')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header - Mobile Optimized */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 lg:static">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/vendor/${vendorId}`)}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0 text-center">
              <h1 className="text-lg font-bold text-gray-900 truncate">{t('bookingForm.title')}</h1>
              <p className="text-xs text-gray-500 truncate">{service.name?.en || service.name}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/bookings')}
              className="flex-shrink-0"
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Cover Image - Smaller on Mobile */}
      {vendor?.coverImageUrl && (
        <div className="w-full h-32 sm:h-48 lg:h-64 bg-gradient-to-r from-blue-500 to-purple-600 relative overflow-hidden">
          <img 
            src={vendor.coverImageUrl} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto px-4 py-4 lg:py-6">
        {/* Mobile: Booking Form First, Desktop: Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Booking Form - Prominent on Mobile */}
          <div className="lg:col-span-2 order-1">
            <Card className="sticky top-16 lg:top-0">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{t('bookingForm.infoTitle')}</CardTitle>
                  {/* Compact Vendor Info on Mobile */}
                  <div className="lg:hidden flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 overflow-hidden border-2 border-white flex items-center justify-center">
                      {vendor?.profileImageUrl ? (
                        <img 
                          src={vendor.profileImageUrl} 
                          alt={vendor.businessName} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-white">
                          {vendor?.businessName?.charAt(0) || 'B'}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{vendor?.businessName}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Customer Details */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-gray-700">{t('bookingForm.yourDetails')}</h3>
                    <Input
                      name="customerName"
                      placeholder={t('bookingForm.fullNamePlaceholder')}
                      value={formData.customerName}
                      onChange={handleInputChange}
                      required
                      className="h-11"
                    />
                    <Input
                      name="customerEmail"
                      type="email"
                      placeholder={t('bookingForm.emailPlaceholder')}
                      value={formData.customerEmail}
                      onChange={handleInputChange}
                      className="h-11"
                    />
                    <Input
                      name="customerPhone"
                      placeholder={t('bookingForm.phonePlaceholder')}
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      required
                      className="h-11"
                    />
                  </div>

                  {/* Date & Time Selection */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-gray-700">{t('booking.selectDateTime')}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                      {availableSlots.map((slot, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSlotSelect(slot)}
                          className={`p-2.5 text-left border rounded-lg transition-all ${
                            selectedSlot?.date === slot.date && selectedSlot?.time === slot.time
                              ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="text-xs font-semibold">{slot.displayDate}</div>
                          <div className="text-xs text-gray-600 mt-0.5">{slot.displayTime}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">{t('bookingForm.additionalNotes')}</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder={t('bookingForm.notesPlaceholder')}
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none text-sm"
                      rows={3}
                    />
                  </div>

                  {/* Price Summary */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">{t('bookingForm.estimatedPrice')}:</span>
                      <span className="text-xl font-bold text-green-600">
                        RM {calculatePrice()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('bookingForm.priceDisclaimer')}
                    </p>
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold" 
                    disabled={submitting || !selectedSlot}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        {t('common.loading')}
                      </>
                    ) : (
                      t('bookingForm.submit')
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Service & Vendor Details - Sidebar on Desktop, Collapsible on Mobile */}
          <div className="space-y-4 order-2 lg:order-2">
            {/* Service Details - Compact */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  {t('bookingForm.serviceDetails')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold text-base">{service.name?.en || service.name}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{service.description?.en || service.description}</p>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-1.5" />
                    <span>{t('bookingForm.durationMinutes', { count: service.duration || 0 })}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <User className="h-4 w-4 mr-1.5" />
                    <span>{t('bookingForm.maxClients', { count: service.maxClients || service.maxGuests || 1 })}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('bookingForm.priceLabel')}</span>
                    <span className="text-lg font-bold text-green-600">
                      {service.priceType === 'fixed' && `RM ${service.price}`}
                      {service.priceType === 'range' && `RM ${service.priceRange?.min || 0}-${service.priceRange?.max || 0}`}
                      {service.priceType === 'from' && t('bookingForm.fromPrice', { price: service.price || 0 })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vendor Info - Compact */}
            <Card className="lg:block hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('bookingForm.vendorInfo')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 overflow-hidden border-2 border-white shadow-md flex items-center justify-center flex-shrink-0">
                    {vendor?.profileImageUrl ? (
                      <img 
                        src={vendor.profileImageUrl} 
                        alt={vendor.businessName} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold text-white">
                        {vendor?.businessName?.charAt(0) || 'B'}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-gray-900 truncate">{vendor.businessName}</p>
                    <p className="text-xs text-gray-500 truncate">{vendor.businessInfo?.address}</p>
                  </div>
                </div>
                {vendor.contactInfo?.phone && (
                  <p className="text-xs text-gray-600">{vendor.contactInfo.phone}</p>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BookingPage;