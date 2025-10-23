import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Calendar, 
  Users, 
  Clock, 
  QrCode, 
  Plus, 
  Edit, 
  Trash2, 
  Download,
  Share2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import axios from '../config/axios';
import { toast } from 'react-toastify';
import ServiceForm from '../components/ServiceForm';

const VendorDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleServiceFormSuccess = () => {
    fetchDashboardData();
  };

  const setOperatingHours = (type) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    days.forEach((day, index) => {
      const enabledCheckbox = document.querySelector(`input[name="${day}_enabled"]`);
      const openInput = document.querySelector(`input[name="${day}_open"]`);
      const closeInput = document.querySelector(`input[name="${day}_close"]`);
      
      if (enabledCheckbox && openInput && closeInput) {
        switch (type) {
          case 'standard':
            enabledCheckbox.checked = index < 5; // Monday-Friday
            openInput.value = index < 5 ? "09:00" : "";
            closeInput.value = index < 5 ? "18:00" : "";
            break;
          case 'extended':
            enabledCheckbox.checked = index < 5; // Monday-Friday
            openInput.value = index < 5 ? "08:00" : "";
            closeInput.value = index < 5 ? "20:00" : "";
            break;
          case 'weekend':
            enabledCheckbox.checked = index < 5; // Monday-Friday only
            openInput.value = index < 5 ? "09:00" : "";
            closeInput.value = index < 5 ? "18:00" : "";
            break;
          case '24/7':
            enabledCheckbox.checked = true;
            openInput.value = "00:00";
            closeInput.value = "23:59";
            break;
        }
      }
    });
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const formData = new FormData(e.target);
      const profileData = {
        businessName: formData.get('businessName'),
        businessType: formData.get('businessType'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        address: formData.get('address'),
        description: formData.get('description'),
        operatingHours: {}
      };

      // Collect operating hours
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      days.forEach(day => {
        const enabled = formData.get(`${day}_enabled`) === 'on';
        const open = formData.get(`${day}_open`);
        const close = formData.get(`${day}_close`);
        
        profileData.operatingHours[day] = {
          enabled,
          open: enabled ? open : null,
          close: enabled ? close : null
        };
      });

      const response = await axios.put('/api/vendors/profile', profileData);
      
      if (response.data.success) {
        alert('Business profile updated successfully!');
        fetchDashboardData(); // Refresh dashboard data
        setActiveTab('overview'); // Go back to overview
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save business profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };


  useEffect(() => {
    if (isAuthenticated) {
      // Add a small delay to ensure token is set
      setTimeout(() => {
        fetchDashboardData();
      }, 100);
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data...');
      console.log('Auth token:', localStorage.getItem('token'));
      console.log('Axios headers:', axios.defaults.headers.common);
      const response = await axios.get('/api/vendors/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 401) {
        // Token is invalid, clear it and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchQRCode = async () => {
    try {
      const response = await axios.get('/api/qr/info');
      setQrCode(response.data);
    } catch (error) {
      console.error('Error fetching QR code:', error);
      toast.error('Failed to load QR code');
    }
  };

  const generateQRCode = async () => {
    try {
      const response = await axios.post('/api/qr/generate');
      setQrCode(response.data.qrCode);
      toast.success('QR code generated successfully!');
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  const downloadQRCode = async () => {
    try {
      const response = await axios.get('/api/qr/download', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'servease-qr-code.png');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('QR code downloaded successfully!');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      await axios.patch(`/api/bookings/${bookingId}/status`, { status });
      toast.success('Booking status updated successfully!');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {dashboardData?.vendor?.businessName}
          </h1>
          <p className="text-gray-600">
            Manage your services, bookings, and business profile
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.stats?.totalBookings || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.stats?.pendingBookings || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Today's Bookings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.stats?.todayBookings || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Services</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.services?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'services', label: 'Services' },
              { id: 'bookings', label: 'Bookings' },
              { id: 'profile', label: 'Business Profile' },
              { id: 'qr', label: 'QR Code' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Today's Bookings */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Today's Bookings
              </h3>
              {dashboardData?.todayBookings?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.todayBookings.map((booking) => (
                    <div key={booking._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(booking.status)}
                        <div>
                          <p className="font-medium text-gray-900">
                            {booking.customer.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {booking.startTime} - {booking.endTime}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                        {booking.status === 'pending' && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => updateBookingStatus(booking._id, 'confirmed')}
                              className="p-1 text-green-600 hover:bg-green-100 rounded"
                              title="Confirm"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateBookingStatus(booking._id, 'cancelled')}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                              title="Cancel"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No bookings for today
                </p>
              )}
            </div>

            {/* Recent Bookings */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Bookings
              </h3>
              {dashboardData?.recentBookings?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.recentBookings.slice(0, 5).map((booking) => (
                    <div key={booking._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {booking.customer.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.bookingDate).toLocaleDateString()} at {booking.startTime}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No recent bookings
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('myServices')}
              </h3>
              <button
                onClick={() => setShowServiceForm(true)}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('addService')}
              </button>
            </div>

            {dashboardData?.services?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardData.services.map((service) => (
                  <div key={service._id} className="card">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {service.name.en}
                      </h4>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => {
                            setEditingService(service);
                            setShowServiceForm(true);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this service?')) {
                              // TODO: Implement delete service
                              toast.info('Delete functionality coming soon');
                            }
                          }}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-3 text-sm">
                      {service.description?.en || 'No description'}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-blue-600">
                        RM {service.price}
                      </span>
                      <span className="text-sm text-gray-500">
                        {service.duration} min
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Services Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Add your first service to start receiving bookings
                </p>
                <button
                  onClick={() => setShowServiceForm(true)}
                  className="btn btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('addService')}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">
              All Bookings
            </h3>
            
            {dashboardData?.recentBookings?.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentBookings.map((booking) => (
                  <div key={booking._id} className="card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(booking.status)}
                        <div>
                          <p className="font-medium text-gray-900">
                            {booking.customer.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {booking.customer.phone}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {new Date(booking.bookingDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {booking.startTime} - {booking.endTime}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                        {booking.status === 'pending' && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => updateBookingStatus(booking._id, 'confirmed')}
                              className="btn btn-success btn-sm"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => updateBookingStatus(booking._id, 'cancelled')}
                              className="btn btn-danger btn-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Bookings Yet
                </h3>
                <p className="text-gray-600">
                  Bookings will appear here once customers start booking your services
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Business Profile
              </h3>
              
              <form onSubmit={handleProfileSave} className="space-y-6">
                {/* Business Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your business name"
                      defaultValue={dashboardData?.vendor?.businessName || ''}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Type
                    </label>
                    <select name="businessType" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select business type</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="salon">Salon & Beauty</option>
                      <option value="fitness">Fitness & Wellness</option>
                      <option value="automotive">Automotive</option>
                      <option value="home">Home Services</option>
                      <option value="professional">Professional Services</option>
                      <option value="retail">Retail</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter phone number"
                      defaultValue={dashboardData?.vendor?.phone || ''}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email address"
                      defaultValue={dashboardData?.vendor?.email || ''}
                      required
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Address
                  </label>
                  <textarea
                    name="address"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your business address"
                    defaultValue={dashboardData?.vendor?.address?.street || ''}
                  />
                </div>

                {/* Business Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Description
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your business, services, and what makes you unique"
                    defaultValue={dashboardData?.vendor?.description || ''}
                  />
                </div>

                {/* Operating Hours - Improved UX */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Operating Hours
                  </label>
                  
                  {/* Quick Setup Options */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Setup</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setOperatingHours('standard')}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
                      >
                        Standard (9 AM - 6 PM)
                      </button>
                      <button
                        type="button"
                        onClick={() => setOperatingHours('extended')}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
                      >
                        Extended (8 AM - 8 PM)
                      </button>
                      <button
                        type="button"
                        onClick={() => setOperatingHours('weekend')}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
                      >
                        Weekend Closed
                      </button>
                      <button
                        type="button"
                        onClick={() => setOperatingHours('24/7')}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
                      >
                        24/7
                      </button>
                    </div>
                  </div>

                  {/* Individual Day Settings */}
                  <div className="space-y-3">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => (
                      <div key={day} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                        <div className="w-24 text-sm font-medium text-gray-700">{day}</div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            name={`${day.toLowerCase()}_enabled`}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            defaultChecked={index < 5} // Monday-Friday enabled by default
                          />
                          <span className="text-sm text-gray-600">Open</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="time"
                            name={`${day.toLowerCase()}_open`}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                            defaultValue={index < 5 ? "09:00" : ""}
                          />
                          <span className="text-gray-500">to</span>
                          <input
                            type="time"
                            name={`${day.toLowerCase()}_close`}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                            defaultValue={index < 5 ? "18:00" : ""}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'qr' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('qrCode')}
              </h3>
              
              {qrCode ? (
                <div className="text-center">
                  <div className="mb-6">
                    <img 
                      src={qrCode.qrImageUrl} 
                      alt="QR Code" 
                      className="mx-auto border rounded-lg"
                      style={{ maxWidth: '300px' }}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        QR Code URL:
                      </label>
                      <div className="flex">
                        <input
                          type="text"
                          value={qrCode.fullUrl}
                          readOnly
                          className="form-input flex-1 rounded-r-none"
                        />
                        <button
                          onClick={() => navigator.clipboard.writeText(qrCode.fullUrl)}
                          className="btn btn-outline rounded-l-none"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Short URL:
                      </label>
                      <div className="flex">
                        <input
                          type="text"
                          value={qrCode.shortUrlFull}
                          readOnly
                          className="form-input flex-1 rounded-r-none"
                        />
                        <button
                          onClick={() => navigator.clipboard.writeText(qrCode.shortUrlFull)}
                          className="btn btn-outline rounded-l-none"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={downloadQRCode}
                        className="btn btn-primary"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {t('downloadQR')}
                      </button>
                      <button
                        onClick={() => navigator.share({ url: qrCode.shortUrlFull })}
                        className="btn btn-outline"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        {t('shareLink')}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No QR Code Generated
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Generate your QR code to start receiving bookings
                  </p>
                  <button
                    onClick={generateQRCode}
                    className="btn btn-primary"
                  >
                    {t('generateQR')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Service Form Modal */}
      <ServiceForm
        isOpen={showServiceForm}
        onClose={() => {
          setShowServiceForm(false);
          setEditingService(null);
        }}
        service={editingService}
        onSuccess={handleServiceFormSuccess}
      />
    </div>
  );
};

export default VendorDashboard;
