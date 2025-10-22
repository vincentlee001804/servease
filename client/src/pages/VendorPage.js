import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Clock, MapPin, Phone, Mail, Calendar, Star } from 'lucide-react';
import axios from '../config/axios';

const VendorPage = () => {
  const { vendorId, shortUrl } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [vendor, setVendor] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        setLoading(true);
        const identifier = vendorId || shortUrl;
        const response = await axios.get(`/api/vendors/public/${identifier}`);
        
        setVendor(response.data.vendor);
        setServices(response.data.services);
      } catch (error) {
        console.error('Error fetching vendor data:', error);
        setError('Vendor not found or inactive');
      } finally {
        setLoading(false);
      }
    };

    const identifier = vendorId || shortUrl;
    if (identifier) {
      fetchVendorData();
    }
  }, [vendorId, shortUrl]);

  const handleBookNow = (service) => {
    navigate(`/booking/${vendor._id}`, { 
      state: { 
        vendor, 
        selectedService: service,
        services 
      } 
    });
  };

  const formatPrice = (price, priceType, priceRange) => {
    switch (priceType) {
      case 'range':
        return `RM ${priceRange?.min || price} - RM ${priceRange?.max || price}`;
      case 'from':
        return `From RM ${price}`;
      default:
        return `RM ${price}`;
    }
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${hours}h ${remainingMinutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading">
          <div className="spinner"></div>
          <span className="ml-3">{t('loading')}</span>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Vendor Not Found</h1>
          <p className="text-gray-600 mb-6">The vendor you're looking for doesn't exist or is inactive.</p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Vendor Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Vendor Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {vendor.businessName}
              </h1>
              <p className="text-gray-600 mb-4">
                {vendor.description}
              </p>
              
              {/* Contact Info */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {vendor.contactInfo.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} />
                    <a 
                      href={`tel:${vendor.contactInfo.phone}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {vendor.contactInfo.phone}
                    </a>
                  </div>
                )}
                {vendor.contactInfo.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={16} />
                    <a 
                      href={`mailto:${vendor.contactInfo.email}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {vendor.contactInfo.email}
                    </a>
                  </div>
                )}
                {vendor.contactInfo.address && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>
                      {vendor.contactInfo.address.street}, {vendor.contactInfo.address.city}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Operating Hours */}
            <div className="bg-gray-50 rounded-lg p-4 min-w-64">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock size={16} />
                Operating Hours
              </h3>
              <div className="space-y-1 text-sm">
                {Object.entries(vendor.operatingHours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between">
                    <span className="capitalize">{day}:</span>
                    <span className={hours.isOpen ? 'text-gray-900' : 'text-gray-500'}>
                      {hours.isOpen ? `${hours.open} - ${hours.close}` : 'Closed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {t('services')}
          </h2>
          <div className="text-sm text-gray-600">
            {services.length} service{services.length !== 1 ? 's' : ''} available
          </div>
        </div>

        {services.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Services Available
            </h3>
            <p className="text-gray-600">
              This vendor hasn't added any services yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {service.name[language] || service.name.en}
                  </h3>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {formatPrice(service.price, service.priceType, service.priceRange)}
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

                {service.requirements && service.requirements.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Requirements:
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {service.requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => handleBookNow(service)}
                  className="btn btn-primary w-full"
                >
                  {t('bookNow')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorPage;
