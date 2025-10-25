import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { doc, getDoc, updateDoc, setDoc, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase-config';
import { toast } from 'react-toastify';
import ServiceForm from '../components/ServiceForm';

const VendorDashboardFirebase = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [hasFetchedData, setHasFetchedData] = useState(false);

  // Form states for business profile
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [operatingHours, setOperatingHours] = useState({
    monday: { open: '09:00', close: '17:00', isOpen: true },
    tuesday: { open: '09:00', close: '17:00', isOpen: true },
    wednesday: { open: '09:00', close: '17:00', isOpen: true },
    thursday: { open: '09:00', close: '17:00', isOpen: true },
    friday: { open: '09:00', close: '17:00', isOpen: true },
    saturday: { open: '09:00', close: '17:00', isOpen: true },
    sunday: { open: '09:00', close: '17:00', isOpen: false }
  });

  const fetchDashboardData = async () => {
    if (hasFetchedData) {
      console.log('Data already fetched, skipping...');
      return;
    }
    
    try {
      setLoading(true);
      setHasFetchedData(true);
      console.log('Fetching dashboard data for user:', user.uid);
      
      // Get vendor profile
      const vendorRef = doc(db, 'vendors', user.uid);
      const vendorDoc = await getDoc(vendorRef);
      
      if (vendorDoc.exists()) {
        const vendorData = vendorDoc.data();
        console.log('Vendor data found:', vendorData);
        
        // Get bookings for this vendor
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('vendorEmail', '==', user.email)
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);
        const bookings = [];
        
        bookingsSnapshot.forEach(doc => {
          bookings.push({ id: doc.id, ...doc.data() });
        });

        console.log('Bookings found:', bookings.length);

        // Calculate dashboard stats
        const totalBookings = bookings.length;
        const pendingBookings = bookings.filter(booking => booking.status === 'pending').length;

        // Get today's bookings
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todaysBookings = bookings.filter(booking => {
          const bookingDate = booking.createdAt?.toDate();
          return bookingDate && bookingDate >= today && bookingDate < tomorrow;
        });

        const dashboardData = {
          vendor: {
            businessName: vendorData.businessName,
            businessType: vendorData.businessInfo?.type || '',
            phone: vendorData.contactInfo?.phone || '',
            email: vendorData.email,
            address: vendorData.businessInfo?.address || '',
            description: vendorData.businessInfo?.description || '',
            operatingHours: vendorData.operatingHours || {}
          },
          stats: {
            totalBookings,
            pendingBookings,
            todaysBookings: todaysBookings.length,
            totalServices: vendorData.services?.length || 0
          },
          recentBookings: todaysBookings.slice(0, 5),
          services: vendorData.services || []
        };

        console.log('Dashboard data prepared:', dashboardData);
        setDashboardData(dashboardData);
        
        // Set form data
        setBusinessName(vendorData.businessName || '');
        setBusinessType(vendorData.businessInfo?.type || '');
        setPhone(vendorData.contactInfo?.phone || '');
        setEmail(vendorData.email || '');
        setAddress(vendorData.businessInfo?.address || '');
        setDescription(vendorData.businessInfo?.description || '');
        setOperatingHours(vendorData.operatingHours || operatingHours);
      } else {
        console.log('No vendor profile found, creating default...');
        // Create a default vendor profile if none exists
        const defaultVendorData = {
          email: user.email,
          businessName: user.displayName || 'My Business',
          contactInfo: {
            phone: '',
            email: user.email
          },
          businessInfo: {
            type: '',
            description: '',
            address: ''
          },
          operatingHours: {
            monday: { open: '09:00', close: '17:00', isOpen: true },
            tuesday: { open: '09:00', close: '17:00', isOpen: true },
            wednesday: { open: '09:00', close: '17:00', isOpen: true },
            thursday: { open: '09:00', close: '17:00', isOpen: true },
            friday: { open: '09:00', close: '17:00', isOpen: true },
            saturday: { open: '09:00', close: '17:00', isOpen: true },
            sunday: { open: '09:00', close: '17:00', isOpen: false }
          },
          services: [],
          qrCode: {
            code: '',
            shortUrl: '',
            qrImage: ''
          },
          createdAt: new Date()
        };

        await setDoc(doc(db, 'vendors', user.uid), defaultVendorData);
        console.log('Default vendor profile created');
        
        // Set default dashboard data
        const defaultDashboardData = {
          vendor: {
            businessName: defaultVendorData.businessName,
            businessType: '',
            phone: '',
            email: user.email,
            address: '',
            description: '',
            operatingHours: defaultVendorData.operatingHours
          },
          stats: {
            totalBookings: 0,
            pendingBookings: 0,
            todaysBookings: 0,
            totalServices: 0
          },
          recentBookings: [],
          services: []
        };

        setDashboardData(defaultDashboardData);
        
        // Set form data
        setBusinessName(defaultVendorData.businessName);
        setBusinessType('');
        setPhone('');
        setEmail(user.email);
        setAddress('');
        setDescription('');
        setOperatingHours(defaultVendorData.operatingHours);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardData();
    } else if (!isAuthenticated && !loading) {
      // User is not authenticated and loading is complete, redirect to login
      console.log('User not authenticated, redirecting to login...');
      window.location.href = '/login';
    }
  }, [isAuthenticated, user, loading]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const vendorRef = doc(db, 'vendors', user.uid);
      await updateDoc(vendorRef, {
        businessName: businessName,
        contactInfo: {
          phone: phone,
          email: email
        },
        businessInfo: {
          type: businessType,
          description: description,
          address: address
        },
        operatingHours: operatingHours,
        updatedAt: new Date()
      });

      toast.success('Business profile updated successfully!');
      setIsEditingProfile(false);
      fetchDashboardData(); // Refresh dashboard data
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update business profile.');
    } finally {
      setSaving(false);
    }
  };

  const generateQRCode = async () => {
    try {
      // Generate QR code data
      const qrData = `https://servease-07762363-b4f31.web.app/vendor/${user.uid}`;
      const shortUrl = `https://servease-07762363-b4f31.web.app/s/${user.uid}`;

      // Update vendor with QR code info
      const vendorRef = doc(db, 'vendors', user.uid);
      await updateDoc(vendorRef, {
        'qrCode.code': qrData,
        'qrCode.shortUrl': shortUrl,
        'qrCode.qrImage': `data:image/png;base64,${qrData}` // Simplified for demo
      });

      setQrCode(qrData);
      toast.success('QR code generated successfully!');
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  const downloadQRCode = async () => {
    try {
      // For now, create a simple download link
      const qrData = `https://servease-07762363-b4f31.web.app/vendor/${user.uid}`;
      const link = document.createElement('a');
      link.href = qrData;
      link.download = 'qrcode.png';
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('QR code downloaded successfully!');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: status,
        updatedAt: new Date()
      });
      
      toast.success('Booking status updated successfully!');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  if (!isAuthenticated) {
    // Redirect to login page instead of showing access denied
    console.log('User not authenticated, redirecting to login...');
    window.location.href = '/login';
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Manage your business and bookings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.stats?.totalBookings || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.stats?.pendingBookings || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.stats?.todaysBookings || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Plus className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Services</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.stats?.totalServices || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'profile', name: 'Business Profile' },
                { id: 'services', name: 'Services' },
                { id: 'bookings', name: 'Bookings' },
                { id: 'qr', name: 'QR Code' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Recent Bookings</h3>
                {dashboardData?.recentBookings?.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.recentBookings.map((booking) => (
                      <div key={booking.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{booking.customer?.name}</p>
                            <p className="text-sm text-gray-600">{booking.customer?.email}</p>
                            <p className="text-sm text-gray-500">{booking.bookingDate} at {booking.startTime}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            booking.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No recent bookings</p>
                )}
              </div>
            )}

            {/* Business Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Business Profile</h3>
                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                        <input
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                        <select
                          value={businessType}
                          onChange={(e) => setBusinessType(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select business type</option>
                          <option value="salon">Hair Salon</option>
                          <option value="restaurant">Restaurant</option>
                          <option value="cafe">Cafe</option>
                          <option value="spa">Spa & Wellness</option>
                          <option value="clinic">Medical Clinic</option>
                          <option value="gym">Fitness Center</option>
                          <option value="beauty">Beauty Services</option>
                          <option value="automotive">Automotive Services</option>
                          <option value="cleaning">Cleaning Services</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Business Name</p>
                        <p className="text-lg text-gray-900">{dashboardData?.vendor?.businessName || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Business Type</p>
                        <p className="text-lg text-gray-900">{dashboardData?.vendor?.businessType || 'Not set'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Phone</p>
                        <p className="text-lg text-gray-900">{dashboardData?.vendor?.phone || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="text-lg text-gray-900">{dashboardData?.vendor?.email || 'Not set'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Address</p>
                      <p className="text-lg text-gray-900">{dashboardData?.vendor?.address || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Description</p>
                      <p className="text-lg text-gray-900">{dashboardData?.vendor?.description || 'Not set'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Services</h3>
                  <button
                    onClick={() => setShowServiceForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </button>
                </div>

                {dashboardData?.services?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboardData.services.map((service) => (
                      <div key={service.id} className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900">{service.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                        <div className="mt-2 flex justify-between items-center">
                          <span className="text-sm font-medium text-green-600">${service.price}</span>
                          <span className="text-sm text-gray-500">{service.duration} min</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No services added yet</p>
                )}
              </div>
            )}

            {/* QR Code Tab */}
            {activeTab === 'qr' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">QR Code</h3>
                <div className="text-center">
                  {qrCode ? (
                    <div className="space-y-4">
                      <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                        <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                          <QrCode className="h-24 w-24 text-gray-400" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={downloadQRCode}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download QR Code
                        </button>
                        <button
                          onClick={() => navigator.clipboard.writeText(qrCode)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Copy Link
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-gray-600">Generate your QR code to start accepting bookings</p>
                      <button
                        onClick={generateQRCode}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        Generate QR Code
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Service Form Modal */}
        {showServiceForm && (
          <ServiceForm
            service={editingService}
            onSuccess={() => {
              setShowServiceForm(false);
              setEditingService(null);
              fetchDashboardData();
            }}
            onClose={() => {
              setShowServiceForm(false);
              setEditingService(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default VendorDashboardFirebase;
