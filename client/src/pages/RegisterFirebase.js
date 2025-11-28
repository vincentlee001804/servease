import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import i18next from '../config/i18n';
import { changeLanguage } from '../config/i18n';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth, db, storage } from '../config/firebase-config';
import { collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Eye, EyeOff, Mail, Lock, Building, Phone, MapPin, Clock, ChevronRight, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const getDefaultOperatingHours = () => ({
  monday: { open: '09:00', close: '18:00', isOpen: true },
  tuesday: { open: '09:00', close: '18:00', isOpen: true },
  wednesday: { open: '09:00', close: '18:00', isOpen: true },
  thursday: { open: '09:00', close: '18:00', isOpen: true },
  friday: { open: '09:00', close: '18:00', isOpen: true },
  saturday: { open: '09:00', close: '18:00', isOpen: false },
  sunday: { open: '09:00', close: '18:00', isOpen: false }
});

const RegisterFirebase = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessType: '',
    phone: '',
    operatingNotes: '',
    businessDescription: '',
    coverImage: null, // Store File object instead of base64
    profileImage: null, // Store File object instead of base64
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: ''
    },
    operatingHours: getDefaultOperatingHours()
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [errors, setErrors] = useState({});
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isGoogleSignup, setIsGoogleSignup] = useState(false);
  const [suppressRedirect, setSuppressRedirect] = useState(false);
  const [coverPreview, setCoverPreview] = useState('');
  const [profilePreview, setProfilePreview] = useState('');
  // Check localStorage synchronously on component initialization (before i18next caches path-based language)
  const [showLanguageModal, setShowLanguageModal] = useState(() => {
    // Check immediately if user_language_preference exists
    // This runs synchronously before any effects or i18next caching
    const savedLanguage = localStorage.getItem('user_language_preference');
    return !savedLanguage; // Show modal if no preference exists
  });

  const { register, signInWithGoogle, user, isLoggingIn } = useAuth();
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const pathLang = location.pathname.split('/').filter(Boolean)[0] || 'en';

  // Sync language preference on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('user_language_preference');
    if (savedLanguage) {
      // Use saved language preference
      if (i18next.language !== savedLanguage) {
        changeLanguage(savedLanguage);
      }
    }
    // If no savedLanguage, modal will show (handled by useState initializer above)
  }, []);

  const businessTypes = [
    { value: 'salon', label: 'Hair Salon' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'cafe', label: 'Cafe' },
    { value: 'spa', label: 'Spa & Wellness' },
    { value: 'clinic', label: 'Medical Clinic' },
    { value: 'gym', label: 'Fitness Center' },
    { value: 'beauty', label: 'Beauty Services' },
    { value: 'automotive', label: 'Automotive Services' },
    { value: 'cleaning', label: 'Cleaning Services' },
    { value: 'other', label: 'Other' }
  ];

  const dayOrder = [
    { key: 'monday', label: t('registerWizard.days.monday') },
    { key: 'tuesday', label: t('registerWizard.days.tuesday') },
    { key: 'wednesday', label: t('registerWizard.days.wednesday') },
    { key: 'thursday', label: t('registerWizard.days.thursday') },
    { key: 'friday', label: t('registerWizard.days.friday') },
    { key: 'saturday', label: t('registerWizard.days.saturday') },
    { key: 'sunday', label: t('registerWizard.days.sunday') },
  ];

  const steps = [
    { number: 1, title: t('registerWizard.steps.account') },
    { number: 2, title: t('registerWizard.steps.details') },
    { number: 3, title: t('registerWizard.steps.operations') },
    { number: 4, title: t('registerWizard.steps.location') }
  ];

useEffect(() => {
  if (user && !isLoggingIn) {
    if (suppressRedirect) {
      setFormData(prev => ({
        ...prev,
        email: prev.email || user.email || ''
      }));
      return;
    }
    const lang = pathLang || localStorage.getItem('i18nextLng') || 'en';
    navigate(`/${lang}/dashboard`, { replace: true });
  }
}, [user, isLoggingIn, navigate, pathLang, suppressRedirect]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing (but only for the specific field)
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // If email field changes, clear email error specifically
    if (name === 'email' && errors.email) {
      setErrors(prev => ({
        ...prev,
        email: ''
      }));
    }
  };

  const handleImageChange = (type, file) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('registerWizard.invalidImageType'));
      return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('registerWizard.imageTooLarge'));
      return;
    }
    
    // Store File object in formData
    setFormData(prev => ({
      ...prev,
      [type]: file
    }));
    
    // Create preview using FileReader for display
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'coverImage') {
        setCoverPreview(reader.result?.toString() || '');
      } else {
        setProfilePreview(reader.result?.toString() || '');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = (type) => {
    setFormData(prev => ({
      ...prev,
      [type]: null
    }));
    if (type === 'coverImage') {
      setCoverPreview('');
    } else {
      setProfilePreview('');
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (isGoogleSignup) {
        return true;
      }
    if (!formData.email) {
      newErrors.email = t('registerWizard.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('registerWizard.errors.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('registerWizard.errors.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('registerWizard.errors.passwordMinLength');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('registerWizard.errors.confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('registerWizard.errors.passwordsDoNotMatch');
    }
    } else if (step === 2) {
    if (!formData.businessName) {
      newErrors.businessName = t('registerWizard.errors.businessNameRequired');
    }

    if (!formData.businessType) {
      newErrors.businessType = t('registerWizard.errors.businessTypeRequired');
    }

    if (!formData.phone) {
      newErrors.phone = t('registerWizard.errors.phoneRequired');
      }
    } else if (step === 3) {
      const hasOpenDay = Object.values(formData.operatingHours || {}).some(day => day.isOpen);
      if (!hasOpenDay) {
        newErrors.operatingHours = t('registerWizard.errors.operatingHoursRequired');
      }
    } else if (step === 4) {
      // Address fields are optional, but we can add validation if needed
    }

    setErrors(newErrors);
    
    // Show toast notification for the first error found
    if (Object.keys(newErrors).length > 0) {
      const firstErrorKey = Object.keys(newErrors)[0];
      const firstErrorMessage = newErrors[firstErrorKey];
      toast.error(firstErrorMessage);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async (event) => {
    if (event) {
      event.preventDefault();
    }
    // Validate current step first
    if (!validateStep(currentStep)) {
      return;
    }

    // If on Step 1, check if email is already registered (Firestore first, then Auth as fallback)
    if (currentStep === 1 && !isGoogleSignup) {
      const trimmedEmail = formData.email?.trim();
      if (!trimmedEmail) return;

      setCheckingEmail(true);
      try {
        // 1) Check Firestore users collection
        console.log('Checking email in Firestore users collection:', trimmedEmail);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', trimmedEmail));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          console.log('Email already exists in Firestore');
          const errorMessage = t('registerWizard.errors.emailAlreadyRegistered');
          setErrors(prev => ({
            ...prev,
            email: errorMessage
          }));
          toast.error(errorMessage);
          setCheckingEmail(false);
          return; // Block moving to next step
        }

        // 2) Fallback: also ask Firebase Auth (in case there is an Auth user without a users doc)
        console.log('Checking email with Firebase Auth as fallback:', trimmedEmail);
        const methods = await fetchSignInMethodsForEmail(auth, trimmedEmail);
        console.log('signInMethods (fallback):', methods);

        if (Array.isArray(methods) && methods.length > 0) {
          console.log('Email already exists in Firebase Auth');
          const errorMessage = t('registerWizard.errors.emailAlreadyRegistered');
          setErrors(prev => ({
            ...prev,
            email: errorMessage
          }));
          toast.error(errorMessage);
          setCheckingEmail(false);
          return; // Block moving to next step
        }

        // Email is available, clear any previous error
        setErrors(prev => ({
          ...prev,
          email: ''
        }));
      } catch (error) {
        console.error('Error checking email uniqueness:', error);
        // On any error, be strict and do NOT allow progression
        const errorMessage = t('registerWizard.errors.emailVerificationFailed');
        setErrors(prev => ({
          ...prev,
          email: errorMessage
        }));
        toast.error(errorMessage);
        setCheckingEmail(false);
        return;
      } finally {
        setCheckingEmail(false);
      }
    }

    if (isGoogleSignup && currentStep === 2) {
      setCurrentStep(3);
      return;
    }

    // Proceed to next step only if email check passed (or not on step 1)
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Helper function to upload image to Firebase Storage and return URL
  const uploadImageToStorage = async (file, userId, imageType) => {
    if (!file) return '';
    
    try {
      const fileExtension = file.name.split('.').pop();
      const imageRef = ref(storage, `vendor-profiles/${userId}/${imageType}-${Date.now()}.${fileExtension}`);
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    } catch (error) {
      console.error(`Error uploading ${imageType}:`, error);
      toast.error(t('registerWizard.imageUploadFailed'));
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(4)) {
      return;
    }

    if (isGoogleSignup) {
      if (!user) {
        toast.error('Please sign in with Google again to continue.');
        return;
      }

      setLoading(true);
      try {
        // Upload images to Firebase Storage
        let coverImageUrl = '';
        let profileImageUrl = '';
        
        if (formData.coverImage) {
          coverImageUrl = await uploadImageToStorage(formData.coverImage, user.uid, 'cover');
        }
        if (formData.profileImage) {
          profileImageUrl = await uploadImageToStorage(formData.profileImage, user.uid, 'profile');
        }

        const addressParts = [
          formData.address.street,
          formData.address.city,
          formData.address.state
        ].filter(Boolean);
        const formattedAddress = [
          addressParts.join(', '),
          formData.address.postalCode
        ].filter(Boolean).join(' ');

        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          businessName: formData.businessName,
          businessType: formData.businessType,
          phone: formData.phone,
          operationsNotes: formData.operatingNotes || '',
          businessDescription: formData.businessDescription || '',
          coverImage: coverImageUrl,
          profileImage: profileImageUrl,
          operatingHours: formData.operatingHours,
          address: formData.address,
          role: 'vendor',
          updatedAt: new Date()
        }, { merge: true });

        await setDoc(doc(db, 'vendors', user.uid), {
          email: user.email,
          businessName: formData.businessName,
          contactInfo: {
            phone: formData.phone || '',
            email: user.email
          },
          businessInfo: {
            type: formData.businessType || '',
            description: formData.businessDescription || '',
            address: formattedAddress
          },
          operationsNotes: formData.operatingNotes || '',
          coverImage: coverImageUrl,
          profileImage: profileImageUrl,
          operatingHours: formData.operatingHours,
          updatedAt: new Date()
        }, { merge: true });

        toast.success(t('registerWizard.profileSaved'));
        const lang = pathLang || localStorage.getItem('i18nextLng') || 'en';
        setSuppressRedirect(false);
        setIsGoogleSignup(false);
        navigate(`/${lang}/dashboard`, { replace: true });
        setTimeout(() => {
          if (!window.location.pathname.endsWith('/dashboard')) {
            window.location.replace(`/${lang}/dashboard`);
          }
        }, 200);
      } catch (error) {
        console.error('Error saving Google signup details:', error);
        toast.error(t('registerWizard.errors.saveFailed'));
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    
    try {
      // Pass File objects to register - it will handle upload to Storage
      const result = await register(formData);
      
      if (result.success) {
        const lang = pathLang || localStorage.getItem('i18nextLng') || 'en';
        navigate(`/${lang}/dashboard`, { replace: true });
        setTimeout(() => {
          if (!window.location.pathname.endsWith('/dashboard')) {
            window.location.replace(`/${lang}/dashboard`);
          }
        }, 200);
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Unified language change handler (used by modal)
  const handleLanguageChange = (langCode) => {
    // Use global changeLanguage function to sync with localStorage
    changeLanguage(langCode);
    
    // Close modal
    setShowLanguageModal(false);
    
    // Show success toast
    const languageNames = {
      'en': 'English',
      'bm': 'Bahasa Melayu',
      'jtzw': '中文'
    };
    toast.success(t('languageModal.languageChanged', { language: languageNames[langCode] || langCode }));
    
    // Navigate to new language URL if needed
    const currentPath = location.pathname.replace(/^\/(en|bm|jtzw)/, '');
    const newPath = `/${langCode}${currentPath}`;
    if (location.pathname !== newPath) {
      navigate(newPath);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!signInWithGoogle) return;
    setGoogleLoading(true);
    setSuppressRedirect(true);
    try {
      const result = await signInWithGoogle();
      if (result?.success) {
        setIsGoogleSignup(true);
        setFormData(prev => ({
          ...prev,
          email: result.user?.email || prev.email,
          password: '',
          confirmPassword: '',
          coverImage: null,
          profileImage: null,
          businessDescription: '',
          operatingNotes: '',
          operatingHours: getDefaultOperatingHours()
        }));
        setCoverPreview('');
        setProfilePreview('');
        setCurrentStep(2);
      } else {
        setSuppressRedirect(false);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error('Google sign-in failed. Please try again.');
      setSuppressRedirect(false);
    } finally {
      setGoogleLoading(false);
    }
  };


  const totalSteps = steps.length;
  const progressPercent = totalSteps > 1
    ? Math.min(100, Math.max(0, ((currentStep - 1) / (totalSteps - 1)) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl py-5 px-6 sm:px-8 flex flex-col">
          {/* Header */}
          <div className="text-center mb-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('registerWizard.title')}</h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('registerWizard.subtitle')}
            </p>
          </div>

          {/* Stepper */}
          <div className="mb-4">
            <div className="grid grid-cols-4 w-full items-center relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-300 z-0">
                <div
                  className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300 z-0"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {steps.map((step) => (
                <div key={step.number} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      currentStep >= step.number ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {currentStep > step.number ? <CheckCircle className="h-5 w-5" /> : <span className="text-sm font-semibold">{step.number}</span>}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'}`}>{step.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {currentStep === 1 && (
              <div className="space-y-5 pb-2">
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                    className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
                  >
                    <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-lg font-bold text-blue-600 border border-gray-200">
                      G
                    </span>
                    {googleLoading ? t('registerWizard.connecting') : t('registerWizard.signUpWithGoogle')}
                  </button>
                  <div className="flex items-center gap-3 text-gray-400 text-xs uppercase tracking-wide">
                    <span className="h-px flex-1 bg-gray-200" />
                    <span>{t('registerWizard.orCreateWithEmail')}</span>
                    <span className="h-px flex-1 bg-gray-200" />
                  </div>
                </div>

                {isGoogleSignup && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                    {t('registerWizard.signedInWithGoogle')} <span className="font-semibold">{formData.email}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('registerWizard.emailAddress')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={checkingEmail || isGoogleSignup}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder={t('registerWizard.emailPlaceholder')}
                    />
                    {checkingEmail && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      </div>
                    )}
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                {!isGoogleSignup && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('registerWizard.password')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.password ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Create a password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                  </div>
                )}

                {!isGoogleSignup && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('registerWizard.confirmPassword')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder={t('registerWizard.confirmPasswordPlaceholder')}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('registerWizard.coverImage')} <span className="text-gray-400 text-xs">{t('registerWizard.optional')}</span>
                  </label>
                  <div className="relative">
                    <div className="h-40 w-full rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                      {coverPreview ? (
                        <>
                          <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                          <div className="absolute top-3 right-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleImageRemove('coverImage')}
                              className="px-3 py-1 text-xs font-medium bg-white/80 text-red-600 rounded-full border border-red-100 hover:bg-red-50 transition"
                            >
                              {t('registerWizard.remove')}
                            </button>
                            <label className="px-3 py-1 text-xs font-medium bg-white/80 text-gray-700 rounded-full border border-gray-200 hover:bg-gray-50 transition cursor-pointer">
                              {t('registerWizard.change')}
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange('coverImage', e.target.files?.[0])} />
                            </label>
                          </div>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center text-center text-gray-500 text-sm cursor-pointer">
                          <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M4 12l4-4 4 4 4-4 4 4M12 4v12" />
                          </svg>
                          {t('registerWizard.uploadCoverImage')}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange('coverImage', e.target.files?.[0])} />
                        </label>
                      )}
                    </div>
                    <div className="absolute -bottom-10 left-6">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          {profilePreview ? <img src={profilePreview} alt="Profile preview" className="w-full h-full object-cover" /> : <span className="text-sm text-gray-500">{t('registerWizard.logo')}</span>}
                        </div>
                        <label className="absolute -bottom-2 right-0 bg-blue-600 text-white text-xs px-2 py-1 rounded-full cursor-pointer shadow">
                          {t('registerWizard.edit')}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange('profileImage', e.target.files?.[0])} />
                        </label>
                        {profilePreview && (
                          <button
                            type="button"
                            onClick={() => handleImageRemove('profileImage')}
                            className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full text-gray-500 w-6 h-6 flex items-center justify-center shadow"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="h-10" />
                </div>

                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('registerWizard.businessName')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="businessName"
                      name="businessName"
                      type="text"
                      value={formData.businessName}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.businessName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder={t('registerWizard.businessNamePlaceholder')}
                    />
                  </div>
                  {errors.businessName && <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>}
                </div>

                <div>
                  <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('registerWizard.businessType')}
                  </label>
                  <div className="relative">
                    <select
                      id="businessType"
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      className={`block w-full pl-3 pr-8 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white ${
                        errors.businessType ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">{t('registerWizard.selectBusinessType')}</option>
                      {businessTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {errors.businessType && <p className="mt-1 text-sm text-red-600">{errors.businessType}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('registerWizard.phoneNumber')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder={t('registerWizard.phonePlaceholder')}
                    />
                  </div>
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="businessDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('registerWizard.businessBio')}
                  </label>
                  <textarea
                    id="businessDescription"
                    name="businessDescription"
                    rows={4}
                    value={formData.businessDescription}
                    onChange={handleChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder={t('registerWizard.businessBioPlaceholder')}
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('registerWizard.operatingHours')}</h3>
                  <p className="text-sm text-gray-500">{t('registerWizard.setWeeklyAvailability')}</p>
                </div>
                <div className="space-y-3">
                  {dayOrder.map(({ key: dayKey, label }) => {
                    const dayData = formData.operatingHours?.[dayKey] || { open: '09:00', close: '18:00', isOpen: false };
                    return (
                      <div key={dayKey} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-gray-900 text-base w-24 flex-shrink-0">{label}</span>
                          <label className="inline-flex items-center gap-2 cursor-pointer flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={dayData.isOpen}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setFormData(prev => ({
                                  ...prev,
                                  operatingHours: {
                                    ...prev.operatingHours,
                                    [dayKey]: { ...prev.operatingHours[dayKey], isOpen: checked }
                                  }
                                }));
                              }}
                              className="sr-only"
                            />
                            <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out ${
                              dayData.isOpen ? 'bg-blue-600' : 'bg-gray-300'
                            }`}>
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                                dayData.isOpen ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </span>
                            <span className={`text-sm font-medium ${
                              dayData.isOpen ? 'text-blue-600' : 'text-gray-500'
                            }`}>
                              {dayData.isOpen ? t('registerWizard.open') : t('registerWizard.closed')}
                            </span>
                          </label>
                        </div>
                        {dayData.isOpen && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <input
                                type="time"
                                value={dayData.open}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setFormData(prev => ({
                                    ...prev,
                                    operatingHours: {
                                      ...prev.operatingHours,
                                      [dayKey]: { ...prev.operatingHours[dayKey], open: value }
                                    }
                                  }));
                                }}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <input
                                type="time"
                                value={dayData.close}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setFormData(prev => ({
                                    ...prev,
                                    operatingHours: {
                                      ...prev.operatingHours,
                                      [dayKey]: { ...prev.operatingHours[dayKey], close: value }
                                    }
                                  }));
                                }}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div>
                  <label htmlFor="operatingNotes" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('registerWizard.operatingNotes')} <span className="text-gray-400 text-xs">{t('registerWizard.optional')}</span>
                  </label>
                  <textarea
                    id="operatingNotes"
                    name="operatingNotes"
                    rows={3}
                    value={formData.operatingNotes}
                    onChange={handleChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder={t('registerWizard.operatingNotesPlaceholder')}
                  />
                </div>
                {errors.operatingHours && <p className="text-sm text-red-600">{errors.operatingHours}</p>}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('registerWizard.streetAddress')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="street"
                      name="address.street"
                      type="text"
                      value={formData.address.street}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('registerWizard.streetPlaceholder')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('registerWizard.city')}
                    </label>
                    <input
                      id="city"
                      name="address.city"
                      type="text"
                      value={formData.address.city}
                      onChange={handleChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('registerWizard.cityPlaceholder')}
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('registerWizard.state')}
                    </label>
                    <input
                      id="state"
                      name="address.state"
                      type="text"
                      value={formData.address.state}
                      onChange={handleChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('registerWizard.statePlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('registerWizard.postalCode')}
                  </label>
                  <input
                    id="postalCode"
                    name="address.postalCode"
                    type="text"
                    value={formData.address.postalCode}
                    onChange={handleChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('registerWizard.postalCodePlaceholder')}
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  {t('registerWizard.back')}
                </button>
              )}
              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={checkingEmail}
                  className="w-full sm:flex-1 flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkingEmail ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      {t('registerWizard.connecting')}
                    </>
                  ) : (
                    <>
                      {t('registerWizard.nextStep', { step: steps[currentStep]?.title || t('registerWizard.next') })}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:flex-1 flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      {t('registerWizard.creatingAccount')}
                    </>
                  ) : (
                    t('registerWizard.completeRegistration')
                  )}
                </button>
              )}
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500">
              {t('registerWizard.signInHere')}{' '}
              <Link
                to={`/${pathLang}/login`}
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                {t('registerWizard.signInLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white w-[90%] max-w-sm rounded-2xl p-6 shadow-2xl text-center">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome / Selamat Datang / 欢迎
              </h2>
              <p className="text-gray-600 text-sm">
                {t('languageModal.selectLanguage')}
              </p>
            </div>

            {/* Language Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => handleLanguageChange('en')}
                className="w-full py-3 px-4 rounded-xl border border-gray-200 hover:bg-blue-50 hover:border-blue-500 font-semibold transition-all text-gray-900"
              >
                English
              </button>
              
              <button
                onClick={() => handleLanguageChange('bm')}
                className="w-full py-3 px-4 rounded-xl border border-gray-200 hover:bg-blue-50 hover:border-blue-500 font-semibold transition-all text-gray-900"
              >
                Bahasa Melayu
              </button>
              
              <button
                onClick={() => handleLanguageChange('jtzw')}
                className="w-full py-3 px-4 rounded-xl border border-gray-200 hover:bg-blue-50 hover:border-blue-500 font-semibold transition-all text-gray-900"
              >
                中文
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterFirebase;
