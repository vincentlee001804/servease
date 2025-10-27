import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  AlertCircle,
  X
} from 'lucide-react';
import { doc, getDoc, updateDoc, setDoc, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase-config';
import { toast } from 'react-toastify';
import QRCodeLib from 'qrcode';
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
  const isFetchingRef = useRef(false);

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
    console.log('fetchDashboardData called', { isFetching: isFetchingRef.current, user: !!user });
    
    if (isFetchingRef.current) {
      console.log('Already fetching, skipping...');
      return;
    }
    
    try {
      isFetchingRef.current = true;
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
          where('vendorId', '==', user.uid)
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);
        const bookings = [];
        
        bookingsSnapshot.forEach(doc => {
          bookings.push({ id: doc.id, ...doc.data() });
        });

        console.log('Bookings found:', bookings.length);

        // Get services for this vendor
        const servicesQuery = query(
          collection(db, 'services'),
          where('vendorId', '==', user.uid),
          where('isActive', '==', true)
        );
        const servicesSnapshot = await getDocs(servicesQuery);
        const services = [];
        
        servicesSnapshot.forEach(doc => {
          services.push({ id: doc.id, ...doc.data() });
        });

        console.log('Services found:', services.length);

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

        // Get recent bookings (all bookings, sorted by creation date, most recent first)
        const recentBookings = bookings
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate() || new Date(0);
            const dateB = b.createdAt?.toDate() || new Date(0);
            return dateB - dateA;
          })
          .slice(0, 10); // Show last 10 bookings

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
            totalServices: services.length
          },
          recentBookings: recentBookings,
          services: services
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
        
        // Update existing vendor profile to include isActive field if missing
        if (vendorData.isActive === undefined) {
          console.log('Updating vendor profile with isActive field...');
          await updateDoc(vendorRef, { isActive: true });
          vendorData.isActive = true;
        }
        
        // Check for existing QR code
        if (vendorData.qrCode && vendorData.qrCode.qrImage) {
          console.log('Loading existing QR code from Firestore:');
          console.log('QR Code URL:', vendorData.qrCode.code);
          console.log('QR Code Image preview:', vendorData.qrCode.qrImage.substring(0, 100) + '...');
          console.log('QR Code Image length:', vendorData.qrCode.qrImage.length);
          
          // Validate that the QR code image is a proper data URL
          if (vendorData.qrCode.qrImage.startsWith('data:image/png;base64,')) {
            console.log('QR code image is valid data URL');
            setQrCode({
              url: vendorData.qrCode.code,
              shortUrl: vendorData.qrCode.shortUrl,
              image: vendorData.qrCode.qrImage
            });
          } else {
            console.error('QR code image is not a valid data URL:', vendorData.qrCode.qrImage.substring(0, 50));
            // Clear the corrupted QR code
            setQrCode(null);
          }
        }
      } else {
        console.log('No vendor profile found, creating default...');
        // Create a default vendor profile if none exists
        const defaultVendorData = {
          email: user.email,
          businessName: user.displayName || 'My Business',
          isActive: true,
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
      console.log('fetchDashboardData completed, setting loading to false');
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    console.log('VendorDashboard: useEffect triggered', { isAuthenticated, user: !!user, loading });
    if (isAuthenticated && user) {
      console.log('VendorDashboard: User authenticated, fetching dashboard data');
      fetchDashboardData();
    }
  }, [isAuthenticated, user]);

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
      console.log('Starting QR code generation...');
      
      // Generate unique vendor URLs
      const vendorUrl = `https://servease-07762363-b4f31.web.app/vendor/${user.uid}`;
      const shortUrl = `https://servease-07762363-b4f31.web.app/s/${user.uid}`;
      
      console.log('Vendor URL:', vendorUrl);
      console.log('Short URL:', shortUrl);

      // Generate actual QR code image
      console.log('Generating QR code image...');
      const qrCodeDataURL = await QRCodeLib.toDataURL(vendorUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      console.log('QR code generated, data URL length:', qrCodeDataURL.length);
      console.log('QR code data URL preview:', qrCodeDataURL.substring(0, 50) + '...');
      
      // Validate the generated QR code
      if (!qrCodeDataURL.startsWith('data:image/png;base64,')) {
        throw new Error('Generated QR code is not a valid data URL');
      }

      // Update vendor with QR code info
      const vendorRef = doc(db, 'vendors', user.uid);
      await updateDoc(vendorRef, {
        'qrCode.code': vendorUrl,
        'qrCode.shortUrl': shortUrl,
        'qrCode.qrImage': qrCodeDataURL,
        'qrCode.generatedAt': new Date()
      });

      console.log('QR code saved to Firestore');

      setQrCode({
        url: vendorUrl,
        shortUrl: shortUrl,
        image: qrCodeDataURL
      });
      
      console.log('QR code state updated');
      toast.success('QR code generated successfully!');
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  const clearQRCode = async () => {
    try {
      console.log('Clearing corrupted QR code...');
      const vendorRef = doc(db, 'vendors', user.uid);
      await updateDoc(vendorRef, {
        'qrCode': null
      });
      setQrCode(null);
      toast.success('QR code cleared. You can now generate a new one.');
    } catch (error) {
      console.error('Error clearing QR code:', error);
      toast.error('Failed to clear QR code');
    }
  };

  const downloadQRCode = async () => {
    try {
      if (!qrCode?.image) {
        toast.error('No QR code available to download');
        return;
      }

      // Create download link for QR code image
      const link = document.createElement('a');
      link.href = qrCode.image;
      link.download = `servease-qrcode-${user.uid}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('QR code downloaded successfully!');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

  const copyQRCodeLink = async () => {
    try {
      if (!qrCode?.url) {
        toast.error('No QR code link available');
        return;
      }

      await navigator.clipboard.writeText(qrCode.url);
      toast.success('QR code link copied to clipboard!');
    } catch (error) {
      console.error('Error copying QR code link:', error);
      toast.error('Failed to copy QR code link');
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

  const deleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return;
    }

    try {
      const serviceRef = doc(db, 'services', serviceId);
      await updateDoc(serviceRef, {
        isActive: false,
        deletedAt: new Date()
      });
      toast.success('Service deleted successfully!');
      // Refresh dashboard data
      setHasFetchedData(false);
      isFetchingRef.current = false;
      await fetchDashboardData();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header - Mobile Optimized */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your business and bookings</p>
        </div>

        {/* Stats Cards - Mobile Optimized */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-3 sm:p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="ml-2 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-600 truncate">Total Bookings</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{dashboardData?.stats?.totalBookings || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-3 sm:p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600" />
              </div>
              <div className="ml-2 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-600 truncate">Pending</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{dashboardData?.stats?.pendingBookings || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-3 sm:p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
                <Users className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="ml-2 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-600 truncate">Today's Bookings</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{dashboardData?.stats?.todaysBookings || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-3 sm:p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <Plus className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div className="ml-2 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-600 truncate">Services</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{dashboardData?.stats?.totalServices || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - Mobile Optimized */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-0 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {[
                { id: 'overview', name: 'Overview', icon: Calendar, shortName: 'Overview' },
                { id: 'profile', name: 'Profile', icon: Users, shortName: 'Profile' },
                { id: 'services', name: 'Services', icon: Plus, shortName: 'Services' },
                { id: 'bookings', name: 'Bookings', icon: Clock, shortName: 'Bookings' },
                { id: 'qr', name: 'QR Code', icon: QrCode, shortName: 'QR' }
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative py-4 px-4 sm:px-6 font-medium text-sm whitespace-nowrap flex items-center justify-center gap-2 min-w-fit flex-shrink-0 transition-colors ${
                      activeTab === tab.id
                        ? 'text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <IconComponent className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{tab.name}</span>
                    <span className="sm:hidden">{tab.shortName}</span>
                    {/* Active indicator */}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t"></div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Recent Bookings Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Recent Bookings</h3>
                    <button
                      onClick={() => setActiveTab('bookings')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View All →
                    </button>
                  </div>
                  
                  {dashboardData?.recentBookings?.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.recentBookings.slice(0, 5).map((booking) => (
                        <div key={booking.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-sm transition-shadow">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900 text-sm truncate">
                                  {booking.serviceName || 'Service Booking'}
                                </h4>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                                  booking.status === 'confirmed' 
                                    ? 'bg-green-100 text-green-800'
                                    : booking.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : booking.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || 'Pending'}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-600">
                                <div className="flex items-center">
                                  <Users className="h-3 w-3 mr-2 flex-shrink-0" />
                                  <span className="truncate">{booking.customerName || 'Customer'}</span>
                                </div>
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-2 flex-shrink-0" />
                                  <span className="truncate">
                                    {booking.bookingDate ? 
                                      new Date(booking.bookingDate).toLocaleDateString('en-US', { 
                                        weekday: 'short', 
                                        month: 'short', 
                                        day: 'numeric' 
                                      }) : 
                                      'Date not set'
                                    }
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 mr-2 flex-shrink-0" />
                                  <span className="truncate">{booking.bookingTime || booking.startTime || 'Time not set'}</span>
                                </div>
                                <div className="flex items-center">
                                  <span className="font-medium text-green-600">RM {booking.price || '0'}</span>
                                </div>
                              </div>
                            </div>
                            
                            {booking.status === 'pending' && (
                              <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                                <button
                                  onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                  className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded transition-colors w-full sm:w-auto"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                  className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded transition-colors w-full sm:w-auto"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h4>
                      <p className="text-gray-500 mb-4">Customer bookings will appear here when they book your services</p>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <button
                          onClick={() => setActiveTab('qr')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                          Generate QR Code
                        </button>
                        <button
                          onClick={() => setActiveTab('services')}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
                        >
                          Add Services
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Business Summary */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Business Summary</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Business Name</p>
                      <p className="font-medium text-gray-900">{dashboardData?.vendor?.businessName || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Business Type</p>
                      <p className="font-medium text-gray-900">{dashboardData?.vendor?.businessType || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Services</p>
                      <p className="font-medium text-gray-900">{dashboardData?.stats?.totalServices || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Active Bookings</p>
                      <p className="font-medium text-gray-900">{dashboardData?.stats?.pendingBookings || 0} pending</p>
                    </div>
                  </div>
                </div>
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

            {/* Services Tab - Mobile Optimized */}
            {activeTab === 'services' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div>
                  <h3 className="text-lg font-medium text-gray-900">Services</h3>
                    <p className="text-sm text-gray-600">Manage your service offerings</p>
                  </div>
                  <button
                    onClick={() => setShowServiceForm(true)}
                    className="touch-target inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </button>
                </div>

                {dashboardData?.services?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {dashboardData.services.map((service) => (
                      <div key={service.id} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                              {service.name?.en || service.name || 'Unnamed Service'}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                              {service.description?.en || service.description || 'No description'}
                            </p>
                        </div>
                          <div className="flex items-center gap-2 ml-3">
                            <button
                              onClick={() => {
                                setEditingService(service);
                                setShowServiceForm(true);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit service"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteService(service.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete service"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                      </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Category</span>
                            <span className="text-xs font-medium text-gray-700 capitalize">
                              {service.category || 'Uncategorized'}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Duration</span>
                            <span className="text-xs font-medium text-gray-700">
                              {service.duration || 0} min
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Price</span>
                            <span className="text-sm font-medium text-green-600">
                              {service.priceType === 'fixed' && `RM ${service.price}`}
                              {service.priceType === 'range' && `RM ${service.priceRange?.min || 0} - ${service.priceRange?.max || 0}`}
                              {service.priceType === 'from' && `From RM ${service.price}`}
                            </span>
                          </div>
                        </div>
                        
                        {service.tags && service.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {service.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {service.tags.length > 3 && (
                              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{service.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Plus className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No services yet</h3>
                    <p className="text-gray-500 mb-6">Start by adding your first service to attract customers</p>
                    <button
                      onClick={() => setShowServiceForm(true)}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Service
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Bookings Tab - Mobile Optimized */}
            {activeTab === 'bookings' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Customer Bookings</h3>
                  <p className="text-sm text-gray-600">Manage and track customer booking requests</p>
                </div>

                {dashboardData?.recentBookings?.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.recentBookings.map((booking) => (
                      <div key={booking.id} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                                {booking.serviceName || 'Service Booking'}
                              </h4>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || 'Pending'}
                              </span>
                            </div>
                            
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2" />
                                <span>{booking.customerName || 'Customer'}</span>
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>{new Date(booking.bookingDate).toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                <span>{booking.bookingTime}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="font-medium text-green-600">RM {booking.price}</span>
                              </div>
                            </div>

                            {booking.notes && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Special Notes:</p>
                                <p className="text-sm text-gray-700">{booking.notes}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            {booking.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                  className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                  className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <button
                                onClick={() => updateBookingStatus(booking.id, 'completed')}
                                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                              >
                                Mark Complete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Calendar className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                    <p className="text-gray-500 mb-6">Customer bookings will appear here when they book your services</p>
                    <div className="text-sm text-gray-400">
                      Share your QR code to start receiving bookings
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* QR Code Tab - Mobile Optimized */}
            {activeTab === 'qr' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">QR Code</h3>
                  {qrCode && (
                    <span className="text-xs sm:text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      ✓ Generated
                    </span>
                  )}
                </div>
                <div className="text-center">
                  {qrCode ? (
                    <div className="space-y-4 sm:space-y-6">
                      {/* QR Code Display - Mobile Optimized */}
                      <div className="inline-block p-4 sm:p-6 bg-white border-2 border-gray-200 rounded-lg shadow-sm">
                        {console.log('QR Code image source:', qrCode.image)}
                        <img 
                          src={qrCode.image} 
                          alt="QR Code" 
                          className="w-48 h-48 sm:w-64 sm:h-64 mx-auto"
                          onLoad={() => console.log('QR code image loaded successfully')}
                          onError={(e) => console.error('QR code image failed to load:', e)}
                        />
                        </div>
                      
                      {/* QR Code Info */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Your unique booking link:</p>
                        <p className="text-sm font-mono text-blue-600 break-all">
                          {qrCode.url}
                        </p>
                      </div>
                      
                      {/* Action Buttons - Mobile Optimized */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                        <button
                          onClick={downloadQRCode}
                          className="touch-target inline-flex items-center justify-center px-4 sm:px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download QR Code
                        </button>
                        <button
                          onClick={copyQRCodeLink}
                          className="touch-target inline-flex items-center justify-center px-4 sm:px-6 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Copy Link
                        </button>
                        <button
                          onClick={clearQRCode}
                          className="touch-target inline-flex items-center justify-center px-4 sm:px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear QR Code
                        </button>
                      </div>
                      
                      {/* Instructions */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">How to use your QR code:</h4>
                        <ul className="text-sm text-blue-800 text-left space-y-1">
                          <li>• Print the QR code and display it at your business</li>
                          <li>• Customers scan the code to access your booking page</li>
                          <li>• Share the link directly via social media or messaging</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-8 rounded-lg">
                        <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">Generate Your QR Code</h4>
                        <p className="text-gray-600 mb-6">
                          Create a unique QR code that customers can scan to book your services directly.
                        </p>
                      <button
                        onClick={generateQRCode}
                          className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        Generate QR Code
                      </button>
                      </div>
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
            isOpen={showServiceForm}
            service={editingService}
            vendorBusinessType={dashboardData?.vendor?.businessType || ''}
            onSuccess={async () => {
              console.log('Service form success - refreshing dashboard data...');
              setShowServiceForm(false);
              setEditingService(null);
              setHasFetchedData(false);
              isFetchingRef.current = false;
              setLoading(true);
              await fetchDashboardData();
              console.log('Dashboard data refresh completed');
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
