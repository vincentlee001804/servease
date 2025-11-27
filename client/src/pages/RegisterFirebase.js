import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth, db } from '../config/firebase-config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Eye, EyeOff, Mail, Lock, Building, Phone, MapPin, ChevronRight, CheckCircle } from 'lucide-react';

const RegisterFirebase = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessType: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: ''
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [errors, setErrors] = useState({});
  const [slideDirection, setSlideDirection] = useState('forward');
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, signInWithGoogle, user, isLoggingIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pathLang = location.pathname.split('/').filter(Boolean)[0] || 'en';

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

  const steps = [
    { number: 1, title: 'Account', fields: ['email', 'password', 'confirmPassword'] },
    { number: 2, title: 'Business', fields: ['businessName', 'businessType', 'phone'] },
    { number: 3, title: 'Address', fields: ['address.street', 'address.city', 'address.state', 'address.postalCode'] }
  ];

  useEffect(() => {
    if (user && !isLoggingIn) {
      const lang = pathLang || localStorage.getItem('i18nextLng') || 'en';
      navigate(`/${lang}/dashboard`, { replace: true });
    }
  }, [user, isLoggingIn, navigate, pathLang]);

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

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }

      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else if (step === 2) {
      if (!formData.businessName) {
        newErrors.businessName = 'Business name is required';
      }

      if (!formData.businessType) {
        newErrors.businessType = 'Business type is required';
      }

      if (!formData.phone) {
        newErrors.phone = 'Phone number is required';
      }
    } else if (step === 3) {
      // Address fields are optional, but we can add validation if needed
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    // Validate current step first
    if (!validateStep(currentStep)) {
      return;
    }

    // If on Step 1, check if email is already registered (Firestore first, then Auth as fallback)
    if (currentStep === 1) {
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
          setErrors(prev => ({
            ...prev,
            email: 'Email is already registered'
          }));
          setCheckingEmail(false);
          return; // Block moving to next step
        }

        // 2) Fallback: also ask Firebase Auth (in case there is an Auth user without a users doc)
        console.log('Checking email with Firebase Auth as fallback:', trimmedEmail);
        const methods = await fetchSignInMethodsForEmail(auth, trimmedEmail);
        console.log('signInMethods (fallback):', methods);

        if (Array.isArray(methods) && methods.length > 0) {
          console.log('Email already exists in Firebase Auth');
          setErrors(prev => ({
            ...prev,
            email: 'Email is already registered'
          }));
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
        setErrors(prev => ({
          ...prev,
          email: 'Unable to verify email right now. Please try again.'
        }));
        setCheckingEmail(false);
        return;
      } finally {
        setCheckingEmail(false);
      }
    }

    // Proceed to next step only if email check passed (or not on step 1)
    setSlideDirection('forward');
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setSlideDirection('backward');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(3)) {
      return;
    }

    setLoading(true);
    
    try {
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

  const handleGoogleSignIn = async () => {
    if (!signInWithGoogle) return;
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result?.success) {
        const lang = pathLang || localStorage.getItem('i18nextLng') || 'en';
        navigate(`/${lang}/dashboard`, { replace: true });
      }
    } finally {
      setGoogleLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl py-5 px-6 sm:px-8 flex flex-col">
          {/* Header */}
          <div className="text-center mb-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Create Your Account</h2>
            <p className="mt-2 text-sm text-gray-600">
              Join ServEase and start managing your business bookings
            </p>
          </div>

          {/* Stepper */}
          <div className="mb-4">
            <div className="grid grid-cols-3 w-full items-center relative">
              {/* Background line spanning full width */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-300 z-0">
                {/* Progress line for completed steps */}
                <div 
                  className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300 z-0"
                  style={{ 
                    width: currentStep > 1 
                      ? currentStep > 2 
                        ? '100%' 
                        : '50%' 
                      : '0%' 
                  }}
                />
              </div>
              
              {/* Step circles and labels */}
              {steps.map((step) => (
                <div key={step.number} className="flex flex-col items-center relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all relative z-10 ${
                    currentStep > step.number
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : currentStep === step.number
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{step.number}</span>
                    )}
                  </div>
                  <span className={`mt-2 text-xs font-medium text-center mx-auto ${
                    currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Form with Slide Animation */}
          <form onSubmit={handleSubmit} className="relative flex flex-col flex-1">
            <div className="relative min-h-[300px] overflow-hidden flex-1">
              {/* Step 1: Account */}
              <div className={`absolute inset-0 transition-all duration-300 ease-in-out ${
                currentStep === 1 
                  ? 'opacity-100 translate-x-0 z-10 pointer-events-auto' 
                  : slideDirection === 'forward' 
                    ? 'opacity-0 -translate-x-full z-0 pointer-events-none' 
                    : 'opacity-0 translate-x-full z-0 pointer-events-none'
              }`}>
                <div className="space-y-4">
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
                      {googleLoading ? 'Connecting...' : 'Sign up with Google'}
                    </button>
                    <div className="flex items-center gap-3 text-gray-400 text-xs uppercase tracking-wide">
                      <span className="h-px flex-1 bg-gray-200"></span>
                      <span>Or create with email</span>
                      <span className="h-px flex-1 bg-gray-200"></span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
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
                        disabled={checkingEmail}
                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your email"
                      />
                      {checkingEmail && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password
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
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
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
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>

              {/* Step 2: Business */}
              <div className={`absolute inset-0 transition-all duration-300 ease-in-out ${
                currentStep === 2 
                  ? 'opacity-100 translate-x-0 z-10 pointer-events-auto' 
                  : currentStep < 2
                    ? 'opacity-0 translate-x-full z-0 pointer-events-none'
                    : 'opacity-0 -translate-x-full z-0 pointer-events-none'
              }`}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name
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
                        placeholder="Enter your business name"
                      />
                    </div>
                    {errors.businessName && <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>}
                  </div>

                  <div>
                    <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-2">
                      Business Type
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
                        <option value="">Select your business type</option>
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
                      Phone Number
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
                        placeholder="Enter your phone number"
                      />
                    </div>
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Step 3: Address */}
              <div className={`absolute inset-0 transition-all duration-300 ease-in-out ${
                currentStep === 3 
                  ? 'opacity-100 translate-x-0 z-10 pointer-events-auto' 
                  : 'opacity-0 translate-x-full z-0 pointer-events-none'
              }`}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address
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
                        placeholder="Enter street address"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        id="city"
                        name="address.city"
                        type="text"
                        value={formData.address.city}
                        onChange={handleChange}
                        className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <input
                        id="state"
                        name="address.state"
                        type="text"
                        value={formData.address.state}
                        onChange={handleChange}
                        className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="State"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                      Postal Code
                    </label>
                    <input
                      id="postalCode"
                      name="address.postalCode"
                      type="text"
                      value={formData.address.postalCode}
                      onChange={handleChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Postal code"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons - Always visible, mobile optimized */}
            <div className="mt-auto flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Back
                </button>
              )}
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={checkingEmail}
                  className="w-full sm:flex-1 flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkingEmail ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Checking...
                    </>
                  ) : (
                    <>
                      Next: {steps[currentStep].title}
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
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
              )}
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500">
              Already have an account?{' '}
              <Link
                to={`/${pathLang}/login`}
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default RegisterFirebase;
