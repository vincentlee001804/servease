import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { doc, getDoc, collection, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { toast } from 'react-toastify';
import { format, isSameDay, isToday } from 'date-fns';
import { enUS, ms, zhCN } from 'date-fns/locale';
import { Calendar, Clock, User, ArrowLeft, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';

const BookingPage = () => {
  const { vendorId, serviceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation('common');
  
  const [vendor, setVendor] = useState(null);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isReschedule, setIsReschedule] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  
  // Booking form data
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    selectedDate: '',
    selectedTime: '',
    notes: ''
  });
  
  const [slotsByDate, setSlotsByDate] = useState({});
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDateObj, setSelectedDateObj] = useState(null);
  const dateStripRef = useRef(null);

  const localeMap = {
    en: enUS,
    bm: ms,
    jtzw: zhCN
  };
  const languageCode = i18n.language;
  const currentLocale = localeMap[languageCode] || enUS;
  const isChineseLanguage = languageCode === 'jtzw';

  const formatDayMonthYear = (date) => {
    if (!date) return '';
    if (isChineseLanguage) {
      return format(date, 'd/M/yyyy', { locale: currentLocale });
    }
    const day = format(date, 'd', { locale: currentLocale });
    const month = format(date, 'MMM', { locale: currentLocale });
    const year = format(date, 'yyyy', { locale: currentLocale });
    return `${day} ${month} ${year}`;
  };

  const formatSelectedDateLabel = (date) => {
    if (!date) return '';
    if (isChineseLanguage) {
      const dayName = format(date, 'EEEE', { locale: currentLocale });
      return `${dayName}, ${formatDayMonthYear(date)}`;
    }
    return format(date, 'EEEE, d MMM', { locale: currentLocale });
  };

  useEffect(() => {
    fetchVendorAndService();
  }, [vendorId, serviceId]);

  // Handle reschedule and reorder state from navigation
  useEffect(() => {
    if (location.state?.isReschedule && location.state?.bookingData) {
      setIsReschedule(true);
      setBookingId(location.state.bookingId);
      const bookingData = location.state.bookingData;
      
      // Pre-fill form with booking data
      setFormData({
        customerName: bookingData.customerName || '',
        customerEmail: bookingData.customerEmail || '',
        customerPhone: bookingData.customerPhone || '',
        selectedDate: bookingData.selectedDate || '',
        selectedTime: bookingData.selectedTime || '',
        notes: bookingData.notes || ''
      });
      
      // Set selected date and time if available
      if (bookingData.selectedDate) {
        const dateObj = new Date(bookingData.selectedDate);
        setSelectedDateObj(dateObj);
      }
      if (bookingData.selectedTime) {
        // Find and set the matching slot
        // This will be handled when slots are loaded
      }
    } else if (location.state?.isReorder && location.state?.bookingData) {
      // Pre-fill form with customer data for reorder (no date/time pre-filled)
      const bookingData = location.state.bookingData;
      setFormData({
        customerName: bookingData.customerName || '',
        customerEmail: bookingData.customerEmail || '',
        customerPhone: bookingData.customerPhone || '',
        selectedDate: '',
        selectedTime: '',
        notes: bookingData.notes || ''
      });
    }
  }, [location.state]);

  const formatDateKey = (date) => date.toISOString().split('T')[0];

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
    const slotsMap = {};
    const datesList = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const dayHours = operatingHours[dayName];

      if (dayHours?.isOpen) {
        const start = new Date(`${date.toDateString()} ${dayHours.open}`);
        const end = new Date(`${date.toDateString()} ${dayHours.close}`);
        const dayKey = formatDateKey(date);
        const slots = [];
        let current = new Date(start);

        while (current < end) {
          const slotDate = new Date(current);
          if (slotDate > now) {
            slots.push({
              date: dayKey,
              time: slotDate.toTimeString().slice(0, 5),
              dateTime: slotDate
            });
          }
          current.setMinutes(current.getMinutes() + 30);
        }

        if (slots.length) {
          slotsMap[dayKey] = slots;
          datesList.push(new Date(date));
        }
      }
    }

    setSlotsByDate(slotsMap);
    setAvailableDates(datesList);

    const firstDate = datesList[0] || null;
    if (firstDate) {
      const key = formatDateKey(firstDate);
      const firstSlot = slotsMap[key]?.[0] || null;
      setSelectedDateObj(firstDate);
      setSelectedSlot(firstSlot);
      setFormData(prev => ({
        ...prev,
        selectedDate: firstSlot?.date || '',
        selectedTime: firstSlot?.time || ''
      }));
    } else {
      setSelectedDateObj(null);
      setSelectedSlot(null);
      setFormData(prev => ({
        ...prev,
        selectedDate: '',
        selectedTime: ''
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    if (!date) {
      setSelectedDateObj(null);
      setSelectedSlot(null);
      setFormData(prev => ({
        ...prev,
        selectedDate: '',
        selectedTime: ''
      }));
      return;
    }

    setSelectedDateObj(date);
    const key = formatDateKey(date);
    const firstSlot = slotsByDate[key]?.[0] || null;
    setSelectedSlot(firstSlot);
    setFormData(prev => ({
      ...prev,
      selectedDate: firstSlot?.date || '',
      selectedTime: firstSlot?.time || ''
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

  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDateObj) return [];
    const key = formatDateKey(selectedDateObj);
    return slotsByDate[key] || [];
  }, [selectedDateObj, slotsByDate]);

  const segmentedSlots = useMemo(() => {
    if (!slotsForSelectedDate.length) return [];

    const segments = [
      { key: 'morning', startHour: 5, endHour: 12, label: t('bookingForm.timeSegments.morning') },
      { key: 'afternoon', startHour: 12, endHour: 18, label: t('bookingForm.timeSegments.afternoon') },
      { key: 'evening', startHour: 18, endHour: 24, label: t('bookingForm.timeSegments.evening') },
    ];

    return segments
      .map(segment => ({
        ...segment,
        slots: slotsForSelectedDate.filter(slot => {
          if (!slot?.dateTime) return false;
          const hour = slot.dateTime.getHours();
          if (segment.key === 'evening') {
            return hour >= segment.startHour;
          }
          return hour >= segment.startHour && hour < segment.endHour;
        })
      }))
      .filter(segment => segment.slots.length > 0);
  }, [slotsForSelectedDate, t]);

  const handleDateStripScroll = (direction) => {
    if (!dateStripRef.current) return;
    const scrollAmount = direction === 'left' ? -200 : 200;
    dateStripRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
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
        price: calculatePrice(),
        // Store service pricing information for proper display
        servicePriceType: service.priceType,
        servicePrice: service.price,
        servicePriceRange: service.priceRange,
        updatedAt: new Date()
      };

      if (isReschedule && bookingId) {
        // Update existing booking for reschedule
        const bookingRef = doc(db, 'bookings', bookingId);
        await updateDoc(bookingRef, {
          ...bookingData,
          status: 'pending', // Reset to pending when rescheduled
          rescheduledAt: new Date()
        });
        
        toast.success('Booking rescheduled successfully!');
        // Navigate back to bookings page - it will use email from localStorage
        // Extract language from current URL path
        const pathLang = location.pathname.split('/').filter(Boolean)[0] || 'en';
        navigate(`/${pathLang}/bookings`);
      } else {
        // Create new booking
        const newBookingData = {
          ...bookingData,
          status: 'pending',
          createdAt: new Date()
        };
        
        const docRef = await addDoc(collection(db, 'bookings'), newBookingData);
        
        toast.success(t('bookingForm.requestSuccess'));
        navigate(`/booking-success/${vendorId}?bookingId=${docRef.id}`);
      }
      
    } catch (error) {
      console.error('Error saving booking:', error);
      toast.error(isReschedule ? 'Failed to reschedule booking' : t('bookingForm.requestFailed'));
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
              <h1 className="text-lg font-bold text-gray-900 truncate">
                {isReschedule ? 'Reschedule Booking' : location.state?.isReorder ? 'Reorder Service' : t('bookingForm.title')}
              </h1>
              <p className="text-xs text-gray-500 truncate">{service.name?.en || service.name}</p>
              {isReschedule && (
                <p className="text-xs text-blue-600 mt-1">Select a new date and time</p>
              )}
              {location.state?.isReorder && (
                <p className="text-xs text-blue-600 mt-1">Book this service again</p>
              )}
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
                    <div className="space-y-4">
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-500">{t('bookingForm.dateCarousel.label')}</p>
                            <p className="text-xs text-gray-400">{t('bookingForm.dateCarousel.hint')}</p>
                          </div>
                          <div className="hidden sm:flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleDateStripScroll('left')}
                              className="h-8 w-8"
                              aria-label={t('bookingForm.dateCarousel.previous')}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleDateStripScroll('right')}
                              className="h-8 w-8"
                              aria-label={t('bookingForm.dateCarousel.next')}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div
                          ref={dateStripRef}
                          className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory"
                        >
                          {availableDates.length > 0 ? (
                            availableDates.map((date) => {
                              const isSelected = selectedDateObj && isSameDay(date, selectedDateObj);
                              const isCurrentDay = isToday(date);
                              return (
                                <button
                                  key={date.toISOString()}
                                  type="button"
                                  onClick={() => handleDateChange(date)}
                                  className={`min-w-[110px] snap-start rounded-2xl border px-3 py-2 text-left transition-all ${
                                    isSelected
                                      ? 'border-blue-600 bg-blue-600 text-white shadow-lg'
                                      : 'border-gray-200 bg-white text-gray-900 shadow-sm hover:border-blue-300'
                                  }`}
                                >
                                  <span className="text-xs uppercase tracking-wide flex items-center gap-1">
                                    {isCurrentDay ? t('bookingForm.todayLabel') : format(date, 'EEE', { locale: currentLocale })}
                                    {isCurrentDay && (
                                      <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-600'}`}></span>
                                    )}
                                  </span>
                                  <div className="text-2xl font-bold leading-tight">
                                    {format(date, 'd', { locale: currentLocale })}
                                  </div>
                                  {!isChineseLanguage && (
                                    <span className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                                      {format(date, 'MMM yyyy', { locale: currentLocale })}
                                    </span>
                                  )}
                                </button>
                              );
                            })
                          ) : (
                            <div className="text-sm text-gray-500">
                              {t('bookingForm.noAvailableDates')}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl border border-gray-100 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-500">{t('bookingForm.timeGrid.label')}</p>
                            {selectedDateObj && (
                              <p className="text-sm font-medium text-gray-900">
                                {formatSelectedDateLabel(selectedDateObj)}
                              </p>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            {selectedSlot
                              ? t('bookingForm.timeGrid.selected', {
                                  time: selectedSlot?.dateTime
                                    ? format(selectedSlot.dateTime, 'p', { locale: currentLocale })
                                    : selectedSlot?.time
                                })
                              : t('bookingForm.timeGrid.tapHint')}
                          </div>
                        </div>
                        <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
                          {segmentedSlots.length > 0 ? (
                            segmentedSlots.map(segment => (
                              <div key={segment.key} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    {segment.label}
                                  </span>
                                  <span className="text-[11px] text-gray-400">
                                    {t('bookingForm.timeGrid.slotCount', { slotCount: segment.slots.length })}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                  {segment.slots.map((slot) => {
                                    const isSelected = selectedSlot?.date === slot.date && selectedSlot?.time === slot.time;
                                    return (
                                      <button
                                        key={`${slot.date}-${slot.time}`}
                                        type="button"
                                        onClick={() => handleSlotSelect(slot)}
                                        className={`rounded-lg border px-2 py-1.5 text-center text-sm font-semibold transition-all ${
                                          isSelected
                                            ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                                            : 'border-gray-200 bg-white text-gray-900 hover:border-blue-300'
                                        }`}
                                      >
                                        <div>{slot.dateTime ? format(slot.dateTime, 'p', { locale: currentLocale }) : slot.time}</div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-gray-500 text-center py-6">
                              {t('bookingForm.noSlots')}
                            </div>
                          )}
                        </div>
                      </div>
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
                
                <div className="flex items-center text-gray-600 text-sm">
                  <Clock className="h-4 w-4 mr-1.5" />
                  <span>{t('bookingForm.durationMinutes', { count: service.duration || 0 })}</span>
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