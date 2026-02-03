import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  linkWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../config/firebase-config';
import { toast } from 'react-toastify';

const AuthContext = createContext();
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const getDefaultOperatingHours = () => ({
  monday: { open: '09:00', close: '17:00', isOpen: true },
  tuesday: { open: '09:00', close: '17:00', isOpen: true },
  wednesday: { open: '09:00', close: '17:00', isOpen: true },
  thursday: { open: '09:00', close: '17:00', isOpen: true },
  friday: { open: '09:00', close: '17:00', isOpen: true },
  saturday: { open: '09:00', close: '17:00', isOpen: true },
  sunday: { open: '09:00', close: '17:00', isOpen: false }
});

const ensureUserRecord = async (firebaseUser) => {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const existingUser = await getDoc(userRef);
  if (!existingUser.exists()) {
    await setDoc(userRef, {
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || '',
      role: 'vendor',
      createdAt: new Date()
    });
  }
};

const ensureVendorProfile = async (firebaseUser) => {
  const vendorRef = doc(db, 'vendors', firebaseUser.uid);
  const existingVendor = await getDoc(vendorRef);
  if (!existingVendor.exists()) {
    await setDoc(vendorRef, {
      email: firebaseUser.email,
      businessName: firebaseUser.displayName || 'My Business',
      contactInfo: {
        phone: '',
        email: firebaseUser.email
      },
      businessInfo: {
        type: '',
        description: '',
        address: ''
      },
      operatingHours: getDefaultOperatingHours(),
      services: [],
      qrCode: {
        code: '',
        shortUrl: '',
        qrImage: ''
      },
      createdAt: new Date()
    });
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('AuthContext: onAuthStateChanged triggered', { 
        hasUser: !!firebaseUser, 
        email: firebaseUser?.email,
        isLoggingIn 
      });
      
      if (firebaseUser) {
        // Get additional user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userObj = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              ...userData
            };
            console.log('AuthContext: Setting user from existing doc', userObj);
            setUser(userObj);
          } else {
            // If user document doesn't exist, create it
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              role: 'vendor',
              createdAt: new Date()
            });
            const userObj = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              role: 'vendor'
            };
            console.log('AuthContext: Setting user from new doc', userObj);
            setUser(userObj);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          const userObj = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName
          };
          console.log('AuthContext: Setting user from error fallback', userObj);
          setUser(userObj);
        }
      } else {
        console.log('AuthContext: No user, setting user to null');
        setUser(null);
      }
      console.log('AuthContext: Setting loading to false, isLoggingIn to false');
      setLoading(false);
      setIsLoggingIn(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper function to upload image to Firebase Storage
  const uploadImageToStorage = async (file, userId, imageType) => {
    if (!file || !(file instanceof File)) return '';
    
    try {
      const fileExtension = file.name.split('.').pop();
      const imageRef = ref(storage, `vendor-profiles/${userId}/${imageType}-${Date.now()}.${fileExtension}`);
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    } catch (error) {
      console.error(`Error uploading ${imageType}:`, error);
      throw error;
    }
  };

  const register = async (userData) => {
    // Google-only auth: block email/password registration
    toast.error('Email/password registration is disabled. Please sign up with Google.');
    return { success: false, message: 'Email/password registration is disabled' };
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoggingIn(true);
      
      // Check if user is already signed in with email/password
      const currentUser = auth.currentUser;
      
      // If user is already signed in with email/password, link Google provider to existing account
      if (currentUser && currentUser.providerData.some(provider => provider.providerId === 'password')) {
        try {
          const result = await signInWithPopup(auth, googleProvider);
          const credential = GoogleAuthProvider.credentialFromResult(result);
          
          if (!credential) {
            throw new Error('Failed to get Google credential');
          }
          
          // Link Google credential to existing account
          await linkWithCredential(currentUser, credential);
          toast.success('Google account linked successfully!');
          return { success: true, user: currentUser };
        } catch (linkError) {
          console.error('Error linking Google account:', linkError);
          if (linkError.code === 'auth/credential-already-in-use') {
            toast.error('This Google account is already linked to another account');
          } else if (linkError.code === 'auth/popup-closed-by-user') {
            toast.error('Sign-in cancelled');
          } else {
            toast.error('Failed to link Google account');
          }
          setIsLoggingIn(false);
          return { success: false, message: 'Failed to link Google account' };
        }
      }
      
      // If user is not signed in, proceed with normal Google sign-in
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const email = firebaseUser.email;

      // After successful Google sign-in, check if this email has other sign-in methods
      // This helps us understand if accounts need to be linked
      try {
        const signInMethods = await fetchSignInMethodsForEmail(auth, email);
        console.log('Sign-in methods for email:', signInMethods);
        
        // If the user only has Google provider, that's fine (new account or Google-only account)
        // If they have both password and Google, that's also fine (accounts are linked)
        // The key is that Firebase handles this automatically when linking is done correctly
      } catch (checkError) {
        console.log('Could not check sign-in methods:', checkError);
      }

      await ensureUserRecord(firebaseUser);
      await ensureVendorProfile(firebaseUser);

      toast.success('Login successful!');
      return { success: true, user: firebaseUser };
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/account-exists-with-different-credential') {
        // This error occurs when an account with this email already exists but with a different provider
        const email = error.customData?.email;
        const errorMessage = email 
          ? `An account with ${email} already exists. Please sign in with email/password first, then you can link your Google account from your profile settings.`
          : 'An account with this email already exists with a different sign-in method. Please use email/password to sign in.';
        
        toast.error(errorMessage);
        setIsLoggingIn(false);
        return {
          success: false,
          message: errorMessage,
          code: error.code
        };
      } else if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign-in cancelled');
        setIsLoggingIn(false);
        return {
          success: false,
          message: 'Sign-in cancelled',
          code: error.code
        };
      } else if (error.code === 'auth/credential-already-in-use') {
        toast.error('This Google account is already linked to another account');
        setIsLoggingIn(false);
        return {
          success: false,
          message: 'This Google account is already in use',
          code: error.code
        };
      }
      
      toast.error('Google sign-in failed');
      setIsLoggingIn(false);
      return {
        success: false,
        message: 'Google sign-in failed'
      };
    }
  };

  const login = async (email, password) => {
    // Google-only auth: block email/password login
    toast.error('Email/password login is disabled. Please continue with Google.');
    return { success: false, message: 'Email/password login is disabled' };
  };

  const resetPassword = async (email) => {
    // Google-only auth: no passwords to reset
    toast.error('Password reset is disabled. Please sign in with Google.');
    return { success: false, message: 'Password reset is disabled' };
  };

  const logout = async () => {
    try {
      console.log('Logging out user...');
      await signOut(auth);
      console.log('User signed out successfully');
      toast.success('Logged out successfully');
      // Redirect to login page after logout - preserve language from URL or localStorage
      console.log('Redirecting to login page...');
      const currentPath = window.location.pathname;
      const segments = currentPath.split('/').filter(Boolean);
      const pathLang = segments[0] && ['en', 'bm', 'jtzw'].includes(segments[0]) 
        ? segments[0] 
        : localStorage.getItem('i18nextLng') || 'en';
      window.location.href = `/${pathLang}/login`;
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  const value = {
    user,
    loading,
    isLoggingIn,
    login,
    register,
    signInWithGoogle,
    logout,
    resetPassword,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};