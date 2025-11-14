import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import i18next from '../config/i18n';
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
  X,
  Phone,
  Mail,
  Sparkles,
  Image as ImageIcon,
  Upload,
  Camera
} from 'lucide-react';
import { doc, getDoc, updateDoc, setDoc, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase-config';
import { toast } from 'react-toastify';
import QRCodeLib from 'qrcode';
import ServiceForm from '../components/ServiceForm';
import AIMarketingTool from '../components/AIMarketingTool';

const VendorDashboardFirebase = () => {
  const { user, isAuthenticated } = useAuth();
  const { lang } = useParams();
  const { t, ready } = useTranslation('common');
  const navigate = useNavigate();
  
  // Sync i18next language with URL language
  useEffect(() => {
    if (lang && i18next.language !== lang) {
      i18next.changeLanguage(lang);
    }
  }, [lang]);

  // Helper function to translate day names
  const translateDay = (dayKey) => {
    return t(`dashboard.${dayKey}`);
  };

  // Helper function to get translated text (for vendor content like service names/descriptions)
  const getTranslatedText = (textObj, fallback = '') => {
    if (typeof textObj === 'string') return textObj;
    if (!textObj) return fallback;
    // Map URL language codes to legacy keys for vendor content translation
    const langMap = { 'en': 'en', 'bm': 'ms', 'jtzw': 'zh' };
    const mappedLang = langMap[lang] || 'en';
    return textObj[mappedLang] || textObj.en || textObj.ms || textObj.zh || fallback;
  };

  // Helper function to get locale for date formatting
  const getLocale = () => {
    const localeMap = { 'en': 'en-US', 'bm': 'ms-MY', 'jtzw': 'zh-CN' };
    return localeMap[lang] || 'en-US';
  };

  // Helper function to get English day name (for matching with operatingHours keys)
  const getEnglishDayName = () => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  };
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

  // Format booking price using booking's stored pricing when available,
  // otherwise fall back to the corresponding service's pricing definition
  const formatBookingPrice = useCallback((booking) => {
    const services = dashboardData?.services || [];
    const matchedService = services.find((s) => s.id === booking.serviceId);

    const priceType = booking.servicePriceType || matchedService?.priceType;
    if (priceType === 'fixed') {
      const price = booking.servicePrice ?? matchedService?.price ?? booking.price;
      return `RM ${price || 0}`;
    }
    if (priceType === 'range') {
      const range = booking.servicePriceRange || matchedService?.priceRange || {};
      const min = range.min ?? 0;
      const max = range.max ?? 0;
      return `RM ${min} - ${max}`;
    }
    if (priceType === 'from') {
      const price = booking.servicePrice ?? matchedService?.price ?? booking.price;
      return `${t('dashboard.priceFrom')} RM ${price || 0}`;
    }
    // Fallback to stored booking price
    return `RM ${booking.price || 0}`;
  }, [dashboardData?.services, t]);

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
  
  // Image states
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  
  const [coverImage, setCoverImage] = useState(null);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false);

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
            operatingHours: vendorData.operatingHours || {},
            profileImageUrl: vendorData.profileImageUrl || '',
            coverImageUrl: vendorData.coverImageUrl || ''
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
        
        // Set image URLs
        setProfileImageUrl(vendorData.profileImageUrl || '');
        setProfileImagePreview(vendorData.profileImageUrl || '');
        setCoverImageUrl(vendorData.coverImageUrl || '');
        setCoverImagePreview(vendorData.coverImageUrl || '');
        
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

  // Handle profile image upload
  const handleProfileImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size should be less than 5MB');
      return;
    }
    
    setProfileImage(file);
    setUploadingProfileImage(true);
    
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = () => setProfileImagePreview(reader.result);
      reader.readAsDataURL(file);
      
      // Upload to Firebase Storage
      const imageRef = ref(storage, `vendor-profiles/${user.uid}/profile-${Date.now()}.${file.name.split('.').pop()}`);
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);
      
      setProfileImageUrl(downloadURL);
      setProfileImagePreview(downloadURL);
      
      // Update Firestore immediately
      const vendorRef = doc(db, 'vendors', user.uid);
      await updateDoc(vendorRef, {
        profileImageUrl: downloadURL,
        updatedAt: new Date()
      });
      
      toast.success('Profile image uploaded successfully');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      toast.error('Failed to upload profile image');
    } finally {
      setUploadingProfileImage(false);
    }
  };
  
  // Handle cover image upload
  const handleCoverImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('Image size should be less than 10MB');
      return;
    }
    
    setCoverImage(file);
    setUploadingCoverImage(true);
    
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = () => setCoverImagePreview(reader.result);
      reader.readAsDataURL(file);
      
      // Upload to Firebase Storage
      const imageRef = ref(storage, `vendor-profiles/${user.uid}/cover-${Date.now()}.${file.name.split('.').pop()}`);
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);
      
      setCoverImageUrl(downloadURL);
      setCoverImagePreview(downloadURL);
      
      // Update Firestore immediately
      const vendorRef = doc(db, 'vendors', user.uid);
      await updateDoc(vendorRef, {
        coverImageUrl: downloadURL,
        updatedAt: new Date()
      });
      
      toast.success('Cover image uploaded successfully');
    } catch (error) {
      console.error('Error uploading cover image:', error);
      toast.error('Failed to upload cover image');
    } finally {
      setUploadingCoverImage(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const vendorRef = doc(db, 'vendors', user.uid);
      const updateData = {
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
      };
      
      // Include image URLs if they exist
      if (profileImageUrl) {
        updateData.profileImageUrl = profileImageUrl;
      }
      if (coverImageUrl) {
        updateData.coverImageUrl = coverImageUrl;
      }
      
      await updateDoc(vendorRef, updateData);

      toast.success(t('dashboard.profileUpdated'));
      setIsEditingProfile(false);
      fetchDashboardData(); // Refresh dashboard data
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('dashboard.updateFailed'));
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
      toast.success(t('dashboard.qrGenerated'));
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error(t('dashboard.qrGenerationFailed'));
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
      
      toast.success(t('dashboard.qrDownloaded'));
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error(t('dashboard.qrDownloadFailed'));
    }
  };

  const copyQRCodeLink = async () => {
    try {
      if (!qrCode?.url) {
        toast.error('No QR code link available');
        return;
      }

      await navigator.clipboard.writeText(qrCode.url);
      toast.success(t('dashboard.linkCopied'));
    } catch (error) {
      console.error('Error copying QR code link:', error);
      toast.error(t('dashboard.linkCopyFailed'));
    }
  };

  // Share QR code link using Web Share API with clipboard fallback
  const shareQRCodeLink = async () => {
    try {
      if (!qrCode?.url) {
        toast.error('No QR code link available');
        return;
      }

      if (navigator.share) {
        await navigator.share({
          title: 'ServEase - Booking Link',
          text: 'Share this booking link with your customers',
          url: qrCode.url,
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(qrCode.url);
        toast.success('Link copied to clipboard');
        return;
      }

      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = qrCode.url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Link copied to clipboard');
    } catch (error) {
      console.error('Error sharing QR code link:', error);
      toast.error('Failed to share link');
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
    if (!window.confirm(t('dashboard.deleteConfirm'))) {
      return;
    }

    try {
      const serviceRef = doc(db, 'services', serviceId);
      await updateDoc(serviceRef, {
        isActive: false,
        deletedAt: new Date()
      });
      toast.success(t('dashboard.serviceDeleted'));
      // Refresh dashboard data
      setHasFetchedData(false);
      isFetchingRef.current = false;
      await fetchDashboardData();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error(t('dashboard.serviceDeleteFailed'));
    }
  };

  if (!isAuthenticated) {
    // Redirect to login page instead of showing access denied - preserve language
    console.log('User not authenticated, redirecting to login...');
    const currentPath = window.location.pathname;
    const segments = currentPath.split('/').filter(Boolean);
    const pathLang = segments[0] && ['en', 'bm', 'jtzw'].includes(segments[0]) 
      ? segments[0] 
      : (lang || localStorage.getItem('i18nextLng') || 'en');
    window.location.href = `/${pathLang}/login`;
    return null;
  }

  // Wait for translations to be ready
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header - Mobile Optimized */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600">{t('dashboard.subtitle')}</p>
        </div>

        {/* Stats Cards - Mobile Optimized */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-3 sm:p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="ml-2 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-600 truncate">{t('dashboard.totalBookings')}</p>
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
                <p className="text-xs font-medium text-gray-600 truncate">{t('dashboard.pending')}</p>
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
                <p className="text-xs font-medium text-gray-600 truncate">{t('dashboard.todaysBookings')}</p>
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
                <p className="text-xs font-medium text-gray-600 truncate">{t('dashboard.services')}</p>
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
                { id: 'overview', name: t('dashboard.overview'), icon: Calendar, shortName: t('dashboard.overview') },
                { id: 'bookings', name: t('dashboard.bookings'), icon: Clock, shortName: t('dashboard.bookings') },
                { id: 'ai', name: t('dashboard.aiMarketing'), icon: Sparkles, shortName: t('dashboard.aiMarketingShort') },
                { id: 'services', name: t('dashboard.services'), icon: Plus, shortName: t('dashboard.services') },
                { id: 'qr', name: t('dashboard.qrCode'), icon: QrCode, shortName: 'QR' },
                { id: 'profile', name: t('dashboard.profile'), icon: Users, shortName: t('dashboard.profile') }
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
                {/* Today's Schedule Calendar View */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {t('dashboard.todaysSchedule')} - {new Date().toLocaleDateString(getLocale(), { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h3>
                  </div>
                  
                  {dashboardData && (() => {
                    // Filter bookings for today
                    const today = new Date().toDateString();
                    const todaysBookings = dashboardData?.recentBookings?.filter(booking => {
                      const bookingDate = booking.bookingDate ? new Date(booking.bookingDate).toDateString() : null;
                      return bookingDate === today;
                    }) || [];

                    // Generate time slots based on operating hours
                    // Use English day name for matching with operatingHours keys
                    const dayKey = getEnglishDayName();
                    const hoursCfg = dashboardData?.vendor?.operatingHours?.[dayKey] || { isOpen: true, open: '08:00', close: '20:00' };
                    const parseHour = (hhmm) => {
                      if (!hhmm) return 0;
                      const parts = hhmm.split(':');
                      return parseInt(parts[0], 10) || 0;
                    };
                    const startHour = hoursCfg.isOpen ? parseHour(hoursCfg.open) : 8;
                    const endHour = hoursCfg.isOpen ? parseHour(hoursCfg.close) : 20;
                    const timeSlots = [];
                    
                    // Always generate time slots, default to 8 AM - 8 PM if no operating hours
                    const defaultStart = startHour || 8;
                    const defaultEnd = endHour || 20;
                    for (let hour = defaultStart; hour <= defaultEnd; hour++) {
                        timeSlots.push({
                          time: hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`,
                          hour: hour,
                          bookings: []
                        });
                    }

                    // Assign bookings to time slots
                    todaysBookings.forEach(booking => {
                      const bookingTime = booking.bookingTime || booking.startTime;
                      if (bookingTime) {
                        const hour = parseInt(bookingTime.split(':')[0]);
                        const timeSlot = timeSlots.find(slot => slot.hour === hour);
                        if (timeSlot) {
                          timeSlot.bookings.push(booking);
                        }
                      }
                    });

                    // Get current time for indicator
                    const now = new Date();
                    const currentHour = now.getHours();
                    const currentMinute = now.getMinutes();
                    const currentTimeInHours = currentHour + (currentMinute / 60);

                    // Always render calendar, even if empty
                    if (timeSlots.length === 0) {
                      // Generate default time slots if none were created
                      for (let hour = 8; hour <= 20; hour++) {
                        timeSlots.push({
                          time: hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`,
                          hour: hour,
                          bookings: []
                        });
                      }
                    }

                    return (
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="max-h-96 overflow-y-auto">
                          {timeSlots.length > 0 ? timeSlots.map((slot, index) => (
                            <div key={slot.time} className="relative">
                              {/* Time indicator line */}
                              {currentTimeInHours >= slot.hour && currentTimeInHours < slot.hour + 1 && (
                                <div className="absolute left-0 right-0 h-0.5 bg-blue-500 z-10" style={{
                                  top: `${((currentTimeInHours - slot.hour) * 100)}%`
                                }}>
                                  <div className="absolute -left-1 -top-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                                </div>
                              )}
                              
                              <div className="flex border-b border-gray-100 last:border-b-0">
                                {/* Time column */}
                                <div className="w-16 bg-gray-50 px-2 py-3 border-r border-gray-200 flex-shrink-0">
                                  <div className="text-xs font-medium text-gray-600 text-center">
                                    {slot.time}
                                  </div>
                                </div>
                                
                                {/* Bookings column */}
                                <div className="flex-1 min-h-[48px] p-2 relative">
                                  {/* Hour line */}
                                  <div className="absolute left-0 right-0 top-0 h-px bg-gray-200"></div>
                                  
                                  {slot.bookings.length > 0 ? (
                                    <div className="space-y-1">
                                      {slot.bookings.map((booking) => (
                                        <div 
                                          key={booking.id} 
                                          className={`p-2 rounded-md border-l-2 ${
                                            booking.status === 'confirmed' 
                                              ? 'bg-green-50 border-green-400' 
                                              : booking.status === 'pending'
                                              ? 'bg-yellow-50 border-yellow-400'
                                              : 'bg-gray-50 border-gray-400'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                              <h4 className="font-medium text-gray-900 text-xs truncate">
                                                {(booking.serviceId && dashboardData?.services) 
                                                  ? getTranslatedText(dashboardData.services.find(s => s.id === booking.serviceId)?.name, booking.serviceName || t('dashboard.serviceBooking'))
                                                  : (booking.serviceName || t('dashboard.serviceBooking'))}
                                              </h4>
                                              <p className="text-xs text-gray-600 truncate">
                                                {booking.customerName || t('dashboard.customer')}
                                              </p>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                              <span className="text-xs font-medium text-gray-900">
                                                {formatBookingPrice(booking)}
                                              </span>
                                              <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${
                                                booking.status === 'confirmed' 
                                                  ? 'bg-green-100 text-green-800'
                                                  : booking.status === 'pending'
                                                  ? 'bg-yellow-100 text-yellow-800'
                                                  : 'bg-gray-100 text-gray-800'
                                              }`}>
                                                {t(`status.${booking.status}`, booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || 'Pending')}
                                              </span>
                                            </div>
                                          </div>
                                          
                                          {booking.status === 'pending' && (
                                            <div className="flex gap-1 mt-1">
                                              <button
                                                onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                                className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded transition-colors"
                                              >
                                                {t('dashboard.confirm')}
                                              </button>
                                              <button
                                                onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                                className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded transition-colors"
                                              >
                                                {t('dashboard.cancel')}
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-gray-300 text-xs py-1">
                                      {t('dashboard.noBookings')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )) : (
                            <div className="p-6 text-center text-gray-500">
                              <p>{t('dashboard.noTimeSlotsAvailable', 'No time slots available')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Show message if calendar couldn't be generated */}
                  {(() => {
                    const dayKey = getEnglishDayName();
                    const hoursCfg = dashboardData?.vendor?.operatingHours?.[dayKey];
                    if (!hoursCfg && !dashboardData?.vendor?.operatingHours) {
                      return (
                        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                          <p className="text-gray-600 mb-2">{t('dashboard.noOperatingHoursSet', 'Operating hours not configured')}</p>
                          <p className="text-sm text-gray-500">{t('dashboard.configureOperatingHours', 'Please configure your operating hours in the Profile section to view your schedule')}</p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {!dashboardData && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                      <p className="text-gray-600">{t('dashboard.loading', 'Loading...')}</p>
                    </div>
                  )}
                </div>

                {/* Business Summary */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t('dashboard.businessSummary')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">{t('dashboard.businessName')}</p>
                      <p className="font-medium text-gray-900">{dashboardData?.vendor?.businessName || t('dashboard.notSet')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('dashboard.businessType')}</p>
                      <p className="font-medium text-gray-900">{dashboardData?.vendor?.businessType || t('dashboard.notSet')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('dashboard.services')}</p>
                      <p className="font-medium text-gray-900">{dashboardData?.stats?.totalServices || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('dashboard.activeBookings')}</p>
                      <p className="font-medium text-gray-900">{dashboardData?.stats?.pendingBookings || 0} {t('dashboard.pending')}</p>
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
                    {isEditingProfile ? t('dashboard.cancel') : t('dashboard.editProfile')}
                  </button>
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    {/* Cover Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                      <div className="relative">
                        <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                          {coverImagePreview ? (
                            <img 
                              src={coverImagePreview} 
                              alt="Cover preview" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-center">
                                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No cover image</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <label className="absolute bottom-2 right-2 bg-white px-3 py-1.5 rounded-md shadow-md hover:bg-gray-50 cursor-pointer border border-gray-300">
                          {uploadingCoverImage ? (
                            <span className="text-sm text-gray-600">Uploading...</span>
                          ) : (
                            <span className="text-sm text-gray-700 flex items-center gap-1">
                              <Upload className="w-4 h-4" />
                              {coverImagePreview ? 'Change' : 'Upload'}
                            </span>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverImageChange}
                            className="hidden"
                            disabled={uploadingCoverImage}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Recommended: 1200x400px, max 10MB</p>
                    </div>

                    {/* Profile Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden border-2 border-gray-300 flex items-center justify-center">
                            {profileImagePreview ? (
                              <img 
                                src={profileImagePreview} 
                                alt="Profile preview" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Camera className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                          <label className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full shadow-md hover:bg-blue-700 cursor-pointer">
                            {uploadingProfileImage ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Camera className="w-4 h-4" />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleProfileImageChange}
                              className="hidden"
                              disabled={uploadingProfileImage}
                            />
                          </label>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 mb-1">Upload a profile picture for your business</p>
                          <p className="text-xs text-gray-500">Recommended: Square image, max 5MB</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('dashboard.businessName')}</label>
                        <input
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('dashboard.businessType')}</label>
                        <select
                          value={businessType}
                          onChange={(e) => setBusinessType(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">{t('dashboard.selectBusinessType')}</option>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('dashboard.phone')}</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('dashboard.email')}</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('dashboard.address')}</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('dashboard.description')}</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Operating Hours Editor */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('dashboard.operatingHours')}</label>
                      <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs text-gray-500 mb-2">{t('dashboard.operatingHoursHint', 'Toggle Open and set the time range for each day.')}</p>
                        <div className="space-y-2">
                        {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map((day) => (
                          <div key={day} className="flex items-center gap-3">
                            <div className="w-28 capitalize text-gray-700">{translateDay(day)}</div>
                            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={!!operatingHours?.[day]?.isOpen}
                                onChange={(e) => setOperatingHours((prev)=>({ ...prev, [day]: { ...(prev?.[day]||{}), isOpen: e.target.checked } }))}
                                className="rounded border-gray-300"
                              />
                              <span className={`${operatingHours?.[day]?.isOpen ? 'text-green-700 bg-green-100' : 'text-gray-600 bg-gray-100'} px-2 py-0.5 rounded-full text-xs`}>{operatingHours?.[day]?.isOpen ? t('dashboard.open') : t('dashboard.closed')}</span>
                            </label>
                            <input
                              type="time"
                              value={operatingHours?.[day]?.open || '09:00'}
                              onChange={(e) => setOperatingHours((prev)=>({ ...prev, [day]: { ...(prev?.[day]||{}), open: e.target.value } }))}
                              disabled={!operatingHours?.[day]?.isOpen}
                              className="px-2 py-1 border border-gray-300 rounded-md text-sm disabled:bg-gray-100 w-28"
                            />
                            <span className="text-gray-500">-</span>
                            <input
                              type="time"
                              value={operatingHours?.[day]?.close || '17:00'}
                              onChange={(e) => setOperatingHours((prev)=>({ ...prev, [day]: { ...(prev?.[day]||{}), close: e.target.value } }))}
                              disabled={!operatingHours?.[day]?.isOpen}
                              className="px-2 py-1 border border-gray-300 rounded-md text-sm disabled:bg-gray-100 w-28"
                            />
                          </div>
                        ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        {t('dashboard.cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? t('dashboard.saving') : t('dashboard.saveChanges')}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {/* Display Cover Image */}
                    {dashboardData?.vendor?.coverImageUrl && (
                      <div className="w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                        <img 
                          src={dashboardData.vendor.coverImageUrl} 
                          alt="Cover" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Display Profile Image */}
                    <div className="flex items-center gap-4 pb-4 border-b">
                      <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden border-2 border-gray-300 flex items-center justify-center">
                        {dashboardData?.vendor?.profileImageUrl ? (
                          <img 
                            src={dashboardData.vendor.profileImageUrl} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">
                              {dashboardData?.vendor?.businessName?.charAt(0) || 'B'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{dashboardData?.vendor?.businessName || 'Business'}</h4>
                        <p className="text-sm text-gray-600">{dashboardData?.vendor?.businessType || 'Business Type'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">{t('dashboard.businessName')}</p>
                        <p className="text-lg text-gray-900">{dashboardData?.vendor?.businessName || t('dashboard.notSet')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">{t('dashboard.businessType')}</p>
                        <p className="text-lg text-gray-900">{dashboardData?.vendor?.businessType || t('dashboard.notSet')}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">{t('dashboard.phone')}</p>
                        <p className="text-lg text-gray-900">{dashboardData?.vendor?.phone || t('dashboard.notSet')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">{t('dashboard.email')}</p>
                        <p className="text-lg text-gray-900">{dashboardData?.vendor?.email || t('dashboard.notSet')}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t('dashboard.address')}</p>
                      <p className="text-lg text-gray-900">{dashboardData?.vendor?.address || t('dashboard.notSet')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t('dashboard.description')}</p>
                      <p className="text-lg text-gray-900">{dashboardData?.vendor?.description || t('dashboard.notSet')}</p>
                    </div>
                    {dashboardData?.vendor?.operatingHours && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">{t('dashboard.operatingHours')}</p>
                        <div className="rounded-md border border-gray-200">
                          {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map((day, idx) => {
                            const hours = dashboardData.vendor.operatingHours[day];
                            const isToday = getEnglishDayName() === day;
                            return (
                              <div key={day} className={`flex items-center justify-between px-3 py-2 ${idx!==6 ? 'border-b border-gray-100':''} ${isToday ? 'bg-blue-50' : ''}`}>
                                <span className={`capitalize ${isToday ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                                  {translateDay(day)} {isToday && <span className="text-xs text-blue-600 ml-1">({t('dashboard.today', 'Today')})</span>}
                                </span>
                                <span className={`text-sm ${hours?.isOpen ? 'text-gray-800' : 'text-gray-500'}`}>
                                  {hours?.isOpen ? `${hours?.open || '09:00'} - ${hours?.close || '17:00'}` : t('dashboard.closed')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* AI Marketing Tab */}
            {activeTab === 'ai' && (
              <div className="space-y-4">
                <AIMarketingTool />
              </div>
            )}

            {/* Services Tab - Mobile Optimized */}
            {activeTab === 'services' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div>
                  <h3 className="text-lg font-medium text-gray-900">{t('dashboard.servicesHeading')}</h3>
                    <p className="text-sm text-gray-600">{t('dashboard.manageServiceOfferings')}</p>
                  </div>
                  <button
                    onClick={() => setShowServiceForm(true)}
                    className="touch-target inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('dashboard.addService')}
                  </button>
                </div>

                {dashboardData?.services?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {dashboardData.services.map((service) => (
                      <div key={service.id} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                              {getTranslatedText(service.name, t('dashboard.unnamedService'))}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                              {getTranslatedText(service.description, t('dashboard.noDescription'))}
                            </p>
                        </div>
                          <div className="flex items-center gap-2 ml-3">
                            <button
                              onClick={() => {
                                setEditingService(service);
                                setShowServiceForm(true);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title={t('dashboard.editService')}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteService(service.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title={t('dashboard.deleteService')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                      </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">{t('dashboard.category', 'Category')}</span>
                            <span className="text-xs font-medium text-gray-700 capitalize">
                              {service.category || t('dashboard.uncategorized', 'Uncategorized')}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">{t('dashboard.serviceDuration', 'Duration')}</span>
                            <span className="text-xs font-medium text-gray-700">
                              {service.duration || 0} {t('vendorPage.minutes', 'min')}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">{t('dashboard.price')}</span>
                            <span className="text-sm font-medium text-green-600">
                              {service.priceType === 'fixed' && `RM ${service.price}`}
                              {service.priceType === 'range' && `RM ${service.priceRange?.min || 0} - ${service.priceRange?.max || 0}`}
                              {service.priceType === 'from' && `${t('dashboard.priceFrom', 'From')} RM ${service.price}`}
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t('dashboard.noServicesYet')}</h3>
                    <p className="text-gray-500 mb-6">{t('dashboard.startAddingServices')}</p>
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
                    <h3 className="text-lg font-medium text-gray-900">{t('dashboard.customerBookings')}</h3>
                  <p className="text-sm text-gray-600">{t('dashboard.manageTrackBookings')}</p>
                </div>

                {dashboardData?.recentBookings?.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.recentBookings.map((booking) => (
                      <div key={booking.id} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                                {(booking.serviceId && dashboardData?.services) 
                                  ? getTranslatedText(dashboardData.services.find(s => s.id === booking.serviceId)?.name, booking.serviceName || t('dashboard.serviceBooking'))
                                  : (booking.serviceName || t('dashboard.serviceBooking'))}
                              </h4>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {t(`status.${booking.status}`, booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || 'Pending')}
                              </span>
                            </div>
                            
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2" />
                                <span>{booking.customerName || t('dashboard.customer')}</span>
                              </div>
                              {booking.customerPhone && (
                                <div className="flex items-center">
                                  <Phone className="h-4 w-4 mr-2" />
                                  <a href={`tel:${booking.customerPhone}`} className="text-blue-600 hover:text-blue-800">
                                    {booking.customerPhone}
                                  </a>
                                </div>
                              )}
                              {booking.customerEmail && (
                                <div className="flex items-center">
                                  <Mail className="h-4 w-4 mr-2" />
                                  <a href={`mailto:${booking.customerEmail}`} className="text-blue-600 hover:text-blue-800">
                                    {booking.customerEmail}
                                  </a>
                                </div>
                              )}
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>{new Date(booking.bookingDate).toLocaleDateString(getLocale(), { 
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
                                <span className="font-medium text-green-600">
                                  {formatBookingPrice(booking)}
                                </span>
                              </div>
                            </div>

                            {booking.notes && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">{t('dashboard.specialNotes')}</p>
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
                                  {t('dashboard.confirm')}
                                </button>
                                <button
                                  onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                  className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                                >
                                  {t('dashboard.cancel')}
                                </button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <button
                                onClick={() => updateBookingStatus(booking.id, 'completed')}
                                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                              >
                                {t('dashboard.markComplete')}
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t('dashboard.noBookingsYet')}</h3>
                    <p className="text-gray-500 mb-6">{t('dashboard.bookingsWillAppear')}</p>
                    <div className="text-sm text-gray-400">
                      {t('dashboard.shareQRToStart')}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* QR Code Tab - Mobile Optimized */}
            {activeTab === 'qr' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">{t('dashboard.qrCode')}</h3>
                  {qrCode && (
                    <span className="text-xs sm:text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      ✓ {t('dashboard.generated')}
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
                        <p className="text-sm text-gray-600 mb-2">{t('dashboard.uniqueBookingLink')}</p>
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
                          {t('dashboard.downloadQR')}
                        </button>
                        <button
                          onClick={shareQRCodeLink}
                          className="touch-target inline-flex items-center justify-center px-4 sm:px-6 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          {t('dashboard.shareQR')}
                        </button>
                        <button
                          onClick={clearQRCode}
                          className="touch-target inline-flex items-center justify-center px-4 sm:px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                        >
                          <X className="h-4 w-4 mr-2" />
                          {t('dashboard.clearQR')}
                        </button>
                      </div>
                      
                      {/* Instructions */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">{t('dashboard.howToUseQR')}</h4>
                        <ul className="text-sm text-blue-800 text-left space-y-1">
                          <li>• {t('dashboard.qrInstructions1')}</li>
                          <li>• {t('dashboard.qrInstructions2')}</li>
                          <li>• {t('dashboard.qrInstructions3')}</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-8 rounded-lg">
                        <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">{t('dashboard.generateQR')}</h4>
                        <p className="text-gray-600 mb-6">
                          {t('dashboard.qrCodeDescription')}
                        </p>
                      <button
                        onClick={generateQRCode}
                          className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        {t('dashboard.generateQR')}
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

