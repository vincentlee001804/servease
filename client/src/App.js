import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Header from './components/HeaderModern';
import Footer from './components/Footer';

// Pages
import Home from './pages/HomeModern';
import VendorPage from './pages/VendorPageModern';
import BookingPage from './pages/BookingPageModern';
import VendorDashboard from './pages/VendorDashboardFirebase';
import Login from './pages/LoginFirebase';
import Register from './pages/RegisterFirebase';

// Context
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

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
                <Route path="/vendor/:vendorId" element={<VendorPage />} />
                <Route path="/s/:shortUrl" element={<VendorPage />} />
                <Route path="/booking/:vendorId" element={<BookingPage />} />
                
                {/* Auth routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected vendor routes */}
                <Route path="/dashboard" element={<VendorDashboard />} />
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
