import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
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
    try {
      const { email, password, businessName, businessType, phone, address, operatingNotes, businessDescription, coverImage, profileImage, operatingHours } = userData;
      
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile
      await updateProfile(user, {
        displayName: businessName
      });

      // Upload images to Firebase Storage if they are File objects
      let coverImageUrl = '';
      let profileImageUrl = '';
      
      try {
        if (coverImage instanceof File) {
          coverImageUrl = await uploadImageToStorage(coverImage, user.uid, 'cover');
        } else if (typeof coverImage === 'string' && coverImage) {
          // If it's already a URL string, use it directly
          coverImageUrl = coverImage;
        }
        
        if (profileImage instanceof File) {
          profileImageUrl = await uploadImageToStorage(profileImage, user.uid, 'profile');
        } else if (typeof profileImage === 'string' && profileImage) {
          // If it's already a URL string, use it directly
          profileImageUrl = profileImage;
        }
      } catch (uploadError) {
        console.error('Error uploading images:', uploadError);
        // Continue with registration even if image upload fails
        toast.error('Registration successful, but image upload failed. You can add images later.');
      }

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        businessName: businessName,
        businessType: businessType || '',
        phone: phone || '',
        address: address || {},
        operationsNotes: operatingNotes || '',
        businessDescription: businessDescription || '',
        coverImage: coverImageUrl,
        profileImage: profileImageUrl,
        role: 'vendor',
        operatingHours: operatingHours || getDefaultOperatingHours(),
        createdAt: new Date()
      });

      // Create vendor profile in Firestore
      await setDoc(doc(db, 'vendors', user.uid), {
        email: email,
        businessName: businessName,
        contactInfo: {
          phone: phone || '',
          email: email
        },
        businessInfo: {
          type: businessType || '',
          description: businessDescription || '',
          address: address ? `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.postalCode || ''}`.trim() : ''
        },
        operationsNotes: operatingNotes || '',
        coverImage: coverImageUrl,
        profileImage: profileImageUrl,
        operatingHours: operatingHours || getDefaultOperatingHours(),
        services: [],
        qrCode: {
          code: '',
          shortUrl: '',
          qrImage: ''
        },
        createdAt: new Date()
      });

      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email is already registered';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoggingIn(true);
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      await ensureUserRecord(firebaseUser);
      await ensureVendorProfile(firebaseUser);

      toast.success('Login successful!');
      return { success: true, user: firebaseUser };
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error('Google sign-in failed');
      setIsLoggingIn(false);
      return {
        success: false,
        message: 'Google sign-in failed'
      };
    }
  };

  const login = async (email, password) => {
    try {
      console.log('AuthContext: Starting login process', { email });
      setIsLoggingIn(true);
      await signInWithEmailAndPassword(auth, email, password);
      console.log('AuthContext: Firebase auth successful');
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
      }
      
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
        code: error.code
      };
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent. Please check your inbox.');
      return { success: true };
    } catch (error) {
      let errorMessage = 'Failed to send reset email';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      toast.error(errorMessage);
      return { success: false, message: errorMessage, code: error.code };
    }
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