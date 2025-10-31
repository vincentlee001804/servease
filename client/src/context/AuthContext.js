import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase-config';
import { toast } from 'react-toastify';

const AuthContext = createContext();

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

  const register = async (userData) => {
    try {
      const { email, password, businessName, businessType, phone, address } = userData;
      
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile
      await updateProfile(user, {
        displayName: businessName
      });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        businessName: businessName,
        businessType: businessType || '',
        phone: phone || '',
        address: address || {},
        role: 'vendor',
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
          description: '',
          address: address ? `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.postalCode || ''}`.trim() : ''
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
      // Redirect to login page after logout
      console.log('Redirecting to login page...');
      window.location.href = '/login';
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