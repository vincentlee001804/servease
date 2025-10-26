import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Header from './components/HeaderModern';
import Footer from './components/Footer';

// Pages
import Home from './pages/HomeModern';
import VendorPage from './pages/VendorPageFirebase';
import BookingPage from './pages/BookingPageModern';
import VendorDashboard from './pages/VendorDashboardFirebase';
import Login from './pages/LoginFirebase';
import Register from './pages/RegisterFirebase';
import TestPage from './pages/TestPage';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

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
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Header />
            <main className="min-h-screen">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/test" element={<TestPage />} />
                <Route path="/vendor/:vendorId" element={<VendorPage />} />
                <Route path="/s/:shortUrl" element={<VendorPage />} />
                <Route path="/booking/:vendorId" element={<BookingPage />} />
                
                {/* Auth routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected vendor routes */}
                <Route path="/dashboard" element={
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
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
