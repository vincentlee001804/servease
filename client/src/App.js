import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// i18n
import './i18n';

// Components
import Header from './components/HeaderModern';
import Footer from './components/Footer';

// Pages
import Home from './pages/HomeModern';
import VendorPage from './pages/VendorPageFirebase';
import BookingPage from './pages/BookingPage';
import BookingSuccess from './pages/BookingSuccess';
import BookingStatus from './pages/BookingStatus';
import VendorDashboard from './pages/VendorDashboardFirebase';
import Login from './pages/LoginFirebase';
import Register from './pages/RegisterFirebase';
import TestPage from './pages/TestPage';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import LanguageWrapper from './components/LanguageWrapper';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading, isLoggingIn } = useAuth();
  
  console.log('ProtectedRoute: Checking auth state', { user: !!user, loading, isLoggingIn });
  
  if (loading || isLoggingIn) {
    console.log('ProtectedRoute: Still loading or logging in, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('ProtectedRoute: User authenticated, rendering children');
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <LanguageProvider>
          <LanguageWrapper>
          <div className="App">
            <Header />
            <main className="min-h-screen">
              <Routes>
                {/* Root redirect */}
                <Route path="/" element={<Navigate to="/en" replace />} />
                
                {/* Language-specific routes */}
                <Route path="/:lang" element={<Home />} />
                <Route path="/:lang/test" element={<TestPage />} />
                <Route path="/:lang/vendor/:vendorId" element={<VendorPage />} />
                <Route path="/:lang/s/:shortUrl" element={<VendorPage />} />
                <Route path="/:lang/booking/:vendorId/:serviceId" element={<BookingPage />} />
                <Route path="/:lang/booking-success/:vendorId" element={<BookingSuccess />} />
                <Route path="/:lang/bookings" element={<BookingStatus />} />
                
                {/* Auth routes */}
                <Route path="/:lang/login" element={<Login />} />
                <Route path="/:lang/register" element={<Register />} />
                
                {/* Protected vendor routes */}
                <Route path="/:lang/dashboard" element={
                  <ProtectedRoute>
                    <VendorDashboard />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
            <Footer />
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </div>
          </LanguageWrapper>
        </LanguageProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
